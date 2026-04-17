---
name: cellix-phase-review
description: Review and gate workflow for Cellix orchestration. Use in the reviewing phase to decide whether a bounded task can move to done, needs revision, or must be blocked based on lane-specific completion gates and validation evidence.
---

# Cellix Phase Review

Use this skill in the `reviewing` phase.

## Review Inputs

- active lane and workflow state
- changed paths
- implementation summary
- targeted validation evidence
- relevant instructions, ADRs, and skill expectations

## Review Workflow

1. Confirm the session is actually in `reviewing`.
2. Check the lane-specific completion gates from `.agents/orchestration/model/orchestration-model.v1.json`.
3. Review changed paths for behavioral regressions, requirement gaps, and missing validation.
4. Decide whether broader validation is still needed for the final gate, or whether the targeted implementation evidence is sufficient for the active lane.
5. Decide one outcome:
   - `done` when the completion gates are satisfied
   - `revising` when findings are actionable and bounded
   - `blocked` when an external blocker prevents safe progress

## Guardrails

- Findings must be concrete enough for a revision phase to act on.
- Do not silently implement fixes while acting as the reviewer.
- If the lane is `reusable-framework-public-surface`, require framework-surface review before final completion.
- Use the minimal artifact posture unless the task risk or complexity clearly requires more.
- When broader validation is run during review, treat failures as review findings or blockers; do not silently repair them while acting as reviewer.

## Output Contract

Produce:

- review outcome
- findings or approval rationale
- gate status
- validation summary
- next transition
