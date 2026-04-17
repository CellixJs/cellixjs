---
sidebar_position: 4
sidebar_label: Orchestration Dogfooding
description: Evidence from adopting and dogfooding the simplified checkpoint-based orchestration workflow in CellixJS.
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

## Hook Validation

The hook runtime is now intentionally small.

The supported startup path is:

1. select `orchestrator` through `/agents`
2. give the orchestrator the task prompt
3. let the hooks enforce `planner -> implementor -> reviewer`

The key runtime checkpoints are:

- `.agents-work/current/plan.md`
- `.agents-work/current/implementer.done`
- `.agents-work/current/review.ok`
- `.agents-work/current/review.feedback`

`sessionStart` initializes `.agents-work/current`, and `preToolUse` prevents the orchestrator from skipping directly to implementation or review.

### Valid checkpoint path

A valid run now looks like this:

1. the planner creates `plan.md`
2. the implementor creates `implementer.done`
3. the reviewer creates `review.ok` or `review.feedback`
4. if feedback exists, one repair cycle is allowed

Observed result:

- the workflow is easier to recover because the checkpoint files are the state
- denial messages point to the missing artifact instead of an abstract transition name
- the orchestrator no longer has to manually assemble `session-init`, `transition`, and evidence commands

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

- multi-lane mixed framework and app tasks still need clear planner discipline; the hook can enforce order, but it cannot invent correct task decomposition
- weaker models still struggle if the planner is allowed to produce option menus instead of one recommended bounded phase
- alternate-profile validation still lives in the legacy `.agents/orchestration` helper layer rather than the checkpoint runtime itself

## What Tightened

- the supported Copilot CLI path is now documented as `/agents -> orchestrator -> task prompt`
- the active runtime is checkpoint-based instead of command-choreography-based
- mixed app/framework tasks are expected to be split by the planner into bounded phases before implementation starts

## Follow-Up Tightening

- improve planner prompts further for mixed-lane tasks such as framework-plus-app deliveries
- keep `cellix-feature-delivery` focused on scenario-based TDD so application delivery does not drift toward framework-contract language
- continue using real repo tasks to validate that the smaller checkpoint workflow degrades gracefully on weaker models
