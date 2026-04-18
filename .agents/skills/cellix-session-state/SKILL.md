---
name: cellix-session-state
description: Workflow-state discipline for the Cellix orchestration model. Use when creating, updating, reviewing, or recovering session state across initialized, planning, plan-complete, implementing, reviewing, revising, blocked, and done phases.
---

# Cellix Session State

Use this skill whenever a task run changes phase or needs recovery.

## Session Fields

Keep these fields coherent for every orchestration session:

- session identifier
- selected repo profile
- selected primary lane
- current workflow state
- recent or current role owner
- artifact mode
- transition history
- blocker summary when blocked

## Valid State Progression

The shared model defines this baseline progression:

- `initialized -> planning`
- `planning -> plan-complete`
- `plan-complete -> implementing`
- `implementing -> reviewing`
- `reviewing -> done`
- `reviewing -> revising -> reviewing`
- `any active state -> blocked`

Do not skip directly from `planning` to `reviewing`, or from `implementing` to `done`.

## Evidence Requirements

Require lightweight evidence before transitions:

- `planning -> plan-complete`: bounded plan and phase owner
- `plan-complete -> implementing`: implementation owner
- `implementing -> reviewing`: change summary and validation evidence
- `reviewing -> revising`: concrete findings
- `reviewing -> done`: completion gates satisfied and final summary
- `blocked -> resumed state`: blocker resolved and resumption rationale

## Role Validity

- `orchestrator` may own intake, planning gates, escalation, and completion.
- `planner` is valid in `planning`.
- `implementor` is valid in `implementing` and `revising`.
- `reviewer` is valid in `reviewing`.
- `framework-surface-reviewer` is only valid in `reviewing` for reusable framework public-surface work.

## Recovery Rules

- Use `blocked` for true external blockers or unresolved ambiguity, not normal review findings.
- Use `revising` when review has actionable findings and implementation can continue.
- If a task changes lanes mid-run, return to `planning` and restate the bounded plan instead of mutating the active implementation phase silently.
