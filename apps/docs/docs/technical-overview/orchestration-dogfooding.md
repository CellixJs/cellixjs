---
sidebar_position: 4
sidebar_label: Orchestration Dogfooding
description: Evidence from adopting and dogfooding the portable orchestration workflow in CellixJS.
---

# Orchestration Dogfooding

Issue [#222](https://github.com/CellixJs/cellixjs/issues/222) is the adoption and evidence slice for the portable orchestration workflow introduced by issue [#218](https://github.com/CellixJs/cellixjs/issues/218).

The goal was not just to ship a model, skills, and hooks. The goal was to prove that the workflow remains useful in the current mixed CellixJS repo and still projects cleanly into future framework-only and application-only repos.

## Mixed-Repo Representative Runs

The current CellixJS repo uses the `mixed-framework-and-app` profile, so the evidence has to cover multiple lane families without collapsing them into one generic process.

| Representative task | Changed or targeted area | Expected lane | Expected profile behavior | Outcome |
| --- | --- | --- | --- | --- |
| Fixture or sandbox task | `.agents/orchestration/tests/**` and runtime CLI assets from issue `#221` | `tooling-workflow` | no framework extension required | clean fit |
| Reusable framework task | representative `packages/cellix/ui-core/**` public-contract work | `reusable-framework-public-surface` | `cellix-tdd` available and required for framework contract work | clean fit |
| Application or reference-app task | representative `apps/ui-community/**` or `packages/ocom/**` feature delivery | `application-feature-delivery` | scenario-based TDD through `cellix-feature-delivery`; no `cellix-tdd` by default | clean fit |
| Contributor docs task | `apps/docs/**` and orchestration docs | `docs-architecture-planning` | documentation lane with no framework extension activation | clean fit |

The lane boundaries stayed coherent:

- framework package work still routes to the reusable framework lanes
- application and reference-app work stay in the application-delivery lane
- tooling and docs work do not inherit framework-only behavior accidentally

## Hook And State-Machine Validation

The hook runtime was dogfooded through sequential session runs.

## Explicit Orchestrator Bootstrap

The most reliable startup path in Copilot CLI is explicit orchestrator selection rather than expecting the repo workflow to be picked up automatically.

The current workflow therefore treats this as the supported path:

1. select `senior-orchestrator` through `/agents`
2. give the orchestrator the task prompt
3. let the orchestrator run `pnpm run orchestration:bootstrap -- --session <session-id> <changed-path>...`

When the changed paths fit one lane cleanly, the helper creates the session and moves it into `planning`. When the paths span both application and reusable-framework classes, it tells the orchestrator to split the work into bounded phases instead of pretending one lane fits the whole task.

### Valid transition path

This command sequence successfully advanced a tooling session from `initialized` into `planning`:

```bash
pnpm run orchestration:hook -- session-init --session dogfood-tooling --lane tooling-workflow --role senior-orchestrator
pnpm run orchestration:hook -- transition --session dogfood-tooling --role senior-orchestrator --to planning --event dogfood-tooling-plan --evidence task-lane-selected,session-created
```

Observed result:

- the session was created with the repo profile set to `mixed-framework-and-app`
- the transition returned `transition-allowed`
- the guidance correctly handed ownership to the next phase

### Framework review-path validation

This framework-oriented sequence exercised the public-surface lane through review:

```bash
pnpm run orchestration:hook -- session-init --session dogfood-framework-1 --lane reusable-framework-public-surface --role senior-orchestrator
pnpm run orchestration:hook -- transition --session dogfood-framework-1 --role senior-orchestrator --to planning --event dogfood-framework-plan-1 --evidence task-lane-selected,session-created
pnpm run orchestration:hook -- handoff implementing --session dogfood-framework-1 --role senior-orchestrator --owner implementation-engineer
pnpm run orchestration:hook -- handoff reviewing --session dogfood-framework-1 --role senior-orchestrator --owner framework-surface-reviewer
```

Observed result:

- the session advanced cleanly to `reviewing`
- `framework-surface-reviewer` was allowed in `reviewing` for `reusable-framework-public-surface`
- the behavior matches the intended boundary where extra framework scrutiny is available only on framework public-surface work

### Invalid transition denial

The runtime also blocked an intentionally invalid jump:

```bash
pnpm run orchestration:hook -- session-init --session dogfood-invalid --lane tooling-workflow --role senior-orchestrator
pnpm run orchestration:hook -- transition --session dogfood-invalid --role senior-orchestrator --to implementing --event dogfood-invalid-implementing-2 --evidence implementation-owner-recorded
```

Observed result:

- the hook returned `invalid-transition`
- the denial guidance listed the valid next states from `initialized`
- recovery was straightforward: move through `planning` first instead of bypassing the gate

### Disallowed role denial

The runtime also blocked an intentionally disallowed reviewer phase owner:

```bash
pnpm run orchestration:hook -- session-init --session dogfood-app-2 --lane application-feature-delivery --role senior-orchestrator
pnpm run orchestration:hook -- transition --session dogfood-app-2 --role senior-orchestrator --to planning --event dogfood-app-plan-2 --evidence task-lane-selected,session-created
pnpm run orchestration:hook -- handoff reviewing --session dogfood-app-2 --role senior-orchestrator --owner qa-reviewer
```

Observed result:

- the hook returned `phase-not-ready`
- the denial guidance pointed back to the missing implementation checkpoint instead of only saying "no"
- the orchestrator can recover cleanly by keeping the implementation owner in place until the session is actually ready for review

## Alternate-Profile Validation

The validator was updated to accept `--spec` so the example profiles can be verified without rewriting the repo root spec.

These example validations both passed:

```bash
node --experimental-strip-types .agents/orchestration/cli/validate-orchestration.ts --repo . --spec .agents/orchestration/examples/framework-only.orchestration.spec.yaml
node --experimental-strip-types .agents/orchestration/cli/validate-orchestration.ts --repo . --spec .agents/orchestration/examples/application-only.orchestration.spec.yaml
```

This matters for portability:

- the framework-only posture stays simple because it only keeps framework, tooling, and docs routing
- the application-only posture stays simple because it completely removes the framework extension surface
- both examples still reuse the same orchestration model, skills, agents, and hook manifest

## What Worked

- The mixed-profile mapping is explicit enough to keep `packages/cellix/**` separate from `apps/**` and `packages/ocom/**`.
- The `cellix-tdd` boundary stayed narrow and understandable once it was documented as framework-only contract work, while `cellix-feature-delivery` stayed responsible for scenario-based application TDD.
- The hook denials were more useful when they returned valid next states or allowed roles instead of a generic rejection.
- Minimal artifact depth was appropriate for routine tasks; heavier per-run paperwork was not needed to get value from the control plane.

## What Felt Heavy

- The hook runtime currently assumes the orchestrator has already selected the lane. It validates the workflow after classification but does not yet automate lane selection from changed paths.
- The current dogfooding evidence is strongest around validation, gating, and documentation. It is lighter on fully automated mixed-repo task routing.
- Alternate-profile validation needed a small `--spec` affordance in the validator CLI to make the examples practical instead of theoretical.

## What Tightened

- The workflow now has an explicit bootstrap helper for orchestrator-led runs instead of relying on ambient discovery.
- The supported Copilot CLI path is now documented as `/agents -> senior-orchestrator -> task prompt`.
- Mixed app/framework changed paths now have a first-class bootstrap response: split phases or escalate before any implementation delegation.

## Follow-Up Tightening

- Add a narrow helper that can suggest a lane from changed paths without turning the spec into a large policy engine.
- Keep `cellix-feature-delivery` focused on scenario-based TDD so application delivery does not drift toward framework-contract language.
- Continue using real repo tasks to refine whether any state evidence names are awkward or overly specific.
