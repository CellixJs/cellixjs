---
sidebar_position: 2
sidebar_label: Orchestration Workflow
description: Portable Cellix orchestration workflow, capability profiles, task lanes, and enforcement layers.
---

# Orchestration Workflow

CellixJS uses a repo-native orchestration control plane so the delivery protocol stays stable even when the repository shape changes.

The workflow introduced by issue [#218](https://github.com/CellixJs/cellixjs/issues/218) is designed to work in three repo topologies:

- the current mixed CellixJS monorepo
- a future framework-only Cellix repo
- a future application-only consumer repo

The repo-local entrypoint is [`orchestration.spec.yaml`](https://github.com/CellixJs/cellixjs/blob/main/orchestration.spec.yaml). The shared defaults live in [`.agents/orchestration/model/orchestration-model.v1.json`](https://github.com/CellixJs/cellixjs/blob/main/.agents/orchestration/model/orchestration-model.v1.json).

In Copilot CLI, the supported startup path is explicit:

1. select the `senior-orchestrator` agent through `/agents`
2. provide the task prompt to that orchestrator
3. let the orchestrator bootstrap the run from the changed paths instead of relying on ambient repo pickup

When the branch already contains unrelated orchestration, tooling, or documentation work, those changed paths should come from the concrete task scope in the prompt or issue rather than the full branch diff.

## Why This Exists

The design goal is to keep the senior-led delivery protocol primary:

1. intake
2. classify the task into one lane
3. gather repo truth
4. create a bounded execution plan
5. execute one bounded phase
6. review and gate
7. summarize or escalate

Persona prompts are secondary. The repo-level contract, instructions, skills, agents, and hooks all exist to support that protocol.

## Control-Plane Layers

The orchestration model enforces a strict authority order:

1. `orchestration.spec.yaml`
2. ADR and architecture-policy intent
3. repo-wide and path-scoped instructions
4. skills
5. custom agents
6. runtime artifacts

Each layer has a different job:

| Layer | Responsibility | What it should not do |
| --- | --- | --- |
| Repo spec | Select profile, declare path/package classes, and define narrow overrides | Restate the whole workflow model |
| ADRs | Explain the architectural intent and invariants | Act as per-run task memory |
| Instructions | Apply routing and repo conventions to concrete paths | Duplicate lane workflows already encoded in skills |
| Skills | Define reusable delivery workflows for a lane or concern | Override repo policy |
| Agents | Provide thin role prompts for a current phase | Invent new process rules |
| Hooks | Enforce transitions, role gating, and action gating at runtime | Replace the control-plane policy |
| Runtime artifacts | Record the current run | Become a source of truth over the spec or ADRs |

## Capability Profiles

The same shared model supports three capability profiles:

| Profile | Supports | Framework extensions |
| --- | --- | --- |
| `mixed-framework-and-app` | framework, application, tooling, docs | `cellix-tdd` |
| `framework-only` | framework, tooling, docs | `cellix-tdd` |
| `application-only` | application, tooling, docs | none |

CellixJS currently uses `mixed-framework-and-app`.

## Current CellixJS Path Classes

The current repo maps concrete paths to abstract classes in [`orchestration.spec.yaml`](https://github.com/CellixJs/cellixjs/blob/main/orchestration.spec.yaml):

| Class | Current mapping intent |
| --- | --- |
| `reusableFramework` | `packages/cellix/**` |
| `applicationPackages` | `apps/api/**`, `apps/server-mongodb-memory-mock/**`, `apps/server-oauth2-mock/**`, `apps/ui-community/**`, `packages/ocom/**` |
| `tooling` | `.agents/**`, `.github/**`, `.husky/**`, build and workspace config |
| `docs` | `README.md`, `apps/docs/**` |

This keeps routing based on capability classes instead of namespace hardcoding.

## Task Lanes

A task run resolves to one primary lane:

| Lane | Family | Use for |
| --- | --- | --- |
| `reusable-framework-public-surface` | reusable framework | public contract changes in `packages/cellix/**` |
| `reusable-framework-internal` | reusable framework | internal framework hardening that preserves the contract |
| `application-feature-delivery` | application delivery | application or reference-app behavior changes |
| `tooling-workflow` | tooling/workflow | repo automation, hooks, validation, CI, and developer tooling |
| `docs-architecture-planning` | docs/planning | ADRs, contributor docs, and architecture planning |

Do not blend lane families in one execution phase. If a task spans framework and application work, split the phases or escalate.

For changed-path triage, use `pnpm run orchestration:suggest-lane -- <path>...` as a helper. It can suggest obvious application, docs, or tooling fits and intentionally refuses to over-claim when reusable-framework changes still require human judgment between internal and public-surface work.

For explicit orchestrator startup, use:

```bash
pnpm run orchestration:bootstrap -- --session <session-id> <path>...
```

`orchestration:bootstrap` normally advances the session into `planning` immediately when the lane is explicit. Do not issue a second `transition planning` call unless bootstrap was run with `--no-planning` or the session remains `initialized`.

After planning is delegated, verify the canonical session artifacts with:

```bash
pnpm run orchestration:session-status -- --session <session-id>
```

The discovery planner is expected to write `.agents-work/orchestration/sessions/<session-id>/plan.md`, and `planning -> plan-complete` is blocked until that artifact exists.

This helper is intentionally narrow:

- it resolves the paths through the repo-local class mappings
- it reuses the shared lane-suggestion logic
- it starts the session and advances it into `planning` only when the lane is explicit
- it tells the orchestrator to split phases when the task spans both application and reusable-framework classes
- it surfaces applicable framework extensions such as `cellix-tdd` for reusable-framework lanes

## Workflow States And Transitions

Every run follows the same state machine:

`initialized -> planning -> plan-complete -> implementing -> reviewing -> done`

Two exceptional states are available:

- `revising` for review-driven rework
- `blocked` for escalations and resumptions

The hooks enforce both valid transitions and the evidence required to move:

| Transition | Required evidence |
| --- | --- |
| `initialized -> planning` | `task-lane-selected`, `session-created` |
| `planning -> plan-complete` | `bounded-plan`, `phase-owner-recorded` |
| `plan-complete -> implementing` | `implementation-owner-recorded` |
| `implementing -> reviewing` | `change-summary`, `validation-evidence` |
| `reviewing -> done` | `completion-gates-satisfied`, `final-summary` |

When a session moves to `done`, the runtime also checks the lane-specific completion gates for the active lane. The generic `completion-gates-satisfied` token is not enough by itself.

Examples:

- `tooling-workflow` also requires `targeted-validation`, `workflow-impact-summary`, and `validation-summary`
- `application-feature-delivery` also requires `acceptance-validation`, `changed-path-review`, and `validation-summary`
- `reusable-framework-public-surface` also requires `public-contract-evidence`, `documentation-alignment`, and `validation-summary`

## `cellix-tdd` Versus `cellix-feature-delivery`

The workflow depends on PR [#186](https://github.com/CellixJs/cellixjs/pull/186), which introduces `cellix-tdd`.

The split is deliberate:

- `cellix-tdd` is the framework-oriented workflow for reusable `@cellix/*` public contracts from the perspective of an external consumer.
- `cellix-feature-delivery` is the application-oriented workflow for scenario-based TDD of application or reference-app behavior.

`cellix-tdd` is only activated when both of these are true:

- the selected profile supports framework behavior
- the selected lane is one of the reusable framework lanes

It is not a global default for tooling, docs, or application delivery.

## Artifact Depth Policy

Runtime artifact depth stays intentionally small by default.

The default `minimal` mode requires only:

- `intake.md`
- `plan.md`
- `final-summary.md`

The workflow can promote to `elevated` mode when risk, parallelism, or cross-cutting work justifies more evidence. In that mode, the model recommends additional artifacts such as:

- `validation.md`
- `review.md`
- `blocked.md`
- `dogfood.md`

This keeps trivial tasks light while still leaving room for heavier auditability when the task actually needs it.

## Future Repo Adoption

Future repos should only keep the profile-specific parts and reuse the shared orchestration core.

Framework-only repos:

- select the `framework-only` profile
- map only framework, tooling, and docs classes
- keep `cellix-tdd` available for framework lanes
- drop application path mappings entirely

Application-only consumer repos:

- select the `application-only` profile
- map only application, tooling, and docs classes
- do not enable `cellix-tdd`
- keep application delivery centered on scenario-based TDD through `cellix-feature-delivery`

The example specs in [`.agents/orchestration/examples/`](https://github.com/CellixJs/cellixjs/tree/main/.agents/orchestration/examples) show both simplified postures.
