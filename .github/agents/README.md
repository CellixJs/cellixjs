# Agent Workflow System

Cellix now uses a simpler checkpoint-driven Copilot CLI workflow under `.agents-work/current/`.

## Entry Point

Use `/agents` and select `orchestrator`.

`senior-orchestrator` remains available as a compatibility alias, but `orchestrator` is the recommended entrypoint.

The orchestrator delegates in a fixed order:

`planner -> implementor -> reviewer -> [one repair cycle] -> stop`

## Hook Files

- `.github/hooks/workflow-enforcement.json`
- `.github/hooks/session-bootstrap.sh`
- `.github/hooks/enforce-agent-workflow.sh`
- `.github/hooks/check-gate.sh`

These hooks follow the documented Copilot CLI hook flow:

- `sessionStart` initializes `.agents-work/current`
- `preToolUse` gates out-of-order agent delegation and blocks `git commit` / `git push`

## Checkpoints

- `phase`
- `plan.md`
- `implementer.done`
- `review.ok`
- `review.feedback`

## Cellix-Specific Policy

The workflow still uses:

- `orchestration.spec.yaml` for repo path classes
- repo instructions and ADR intent
- framework vs app split rules

If a task spans both `packages/cellix/**` and application paths, the planner should split it into bounded phases instead of blending one large implementation pass.
