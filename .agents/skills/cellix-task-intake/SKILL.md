---
name: cellix-task-intake
description: Intake and lane-classification workflow for Cellix orchestration. Use when starting work in a repo with orchestration.spec.yaml, when you need to classify a task into the reusable framework, application delivery, tooling/workflow, or docs/planning lanes, or when an orchestrator needs a bounded planning handoff.
---

# Cellix Task Intake

Use this skill at the start of a task run.

## Required Inputs

- `orchestration.spec.yaml`
- `.agents/orchestration/model/orchestration-model.v1.json`
- the user request or issue description
- the concrete paths likely to change, when known

## Intake Workflow

1. Read the repo capability `profile` and path `classes` from `orchestration.spec.yaml`.
2. Map the task to one primary path class. If the task crosses classes, still choose one primary lane and record the secondary impact.
3. Select one primary lane:
   - `reusable-framework-public-surface` for reusable framework contract, export, README, TSDoc, manifest, or consumer-visible behavior changes
   - `reusable-framework-internal` for reusable framework refactors or hardening that preserve contract
   - `application-feature-delivery` for application or reference-app delivery
   - `tooling-workflow` for automation, hooks, validation, CI, scripts, and instruction plumbing
   - `docs-architecture-planning` for ADRs, contributor docs, planning, and architecture notes
4. Set the initial workflow transition to `initialized -> planning`.
5. Resolve artifact posture from the profile default unless the task risk clearly requires `elevated`.

## Guardrails

- Choose exactly one primary lane per task run.
- Do not activate `cellix-tdd` unless the selected lane is in the `reusable-framework` family and the profile allows framework extensions.
- If the request would require both application delivery and reusable framework contract work, escalate the split instead of pretending it is one homogeneous phase.
- If the lane is materially ambiguous, stop and collaborate with the user before planning.

## Output Contract

Produce a short intake summary that records:

- selected profile
- touched or expected path classes
- primary lane
- artifact mode
- state transition into `planning`
- blockers or clarifications required before implementation
