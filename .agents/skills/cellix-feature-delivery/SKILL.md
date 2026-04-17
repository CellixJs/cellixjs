---
name: cellix-feature-delivery
description: Bounded application-delivery workflow for Cellix repos. Use for application or reference-app tasks in the application-feature-delivery lane, including planning, failing-test-first delivery, validation, and review preparation. Do not use for reusable framework contract work.
---

# Cellix Feature Delivery

Use this skill for the `application-feature-delivery` lane.

## Purpose

This is the standard bounded, TDD-driven delivery workflow for application and reference-app work. It is intentionally separate from `cellix-tdd`, which remains the reusable-framework public-consumer contract workflow.

TDD is central here:

- expected behavior must be clarified before implementation
- behavior changes should start with failing scenario-based tests at the application boundary
- implementation should emerge from those failing tests rather than from ad hoc code-first changes

The distinction matters:

- `cellix-feature-delivery` drives TDD for scenario-based application behavior, bounded delivery, and application-level regression control
- `cellix-tdd` drives TDD for reusable framework public contracts from the perspective of an external consumer

## Workflow

1. Confirm the active lane is `application-feature-delivery`.
2. Gather repo truth from the affected application paths, nearby tests, and path-scoped instructions.
3. Produce a bounded plan before implementation.
4. Clarify the expected behavior as application scenarios before writing code.
5. When behavior changes, add or update failing scenario-based tests first using the repo's existing application test stack.
6. Implement only the bounded phase required to make the tests pass.
7. Run the most relevant targeted validation for the changed paths.
8. Prepare a review summary with changed paths, failing-test-first evidence, validation, and residual risk.

## Guardrails

- Keep the phase bounded. If the work expands materially, return to planning.
- Do not treat `packages/cellix/**/*` reusable framework contract work as application delivery.
- If an application task requires a reusable framework public-surface change, escalate to the orchestrator for lane reclassification and route that framework portion to `cellix-tdd`.
- Preserve existing application conventions and path-scoped instructions instead of importing framework-specific contract requirements by default.
- Do not skip straight to implementation when behavior is changing; write or update the failing test first unless the task is purely non-behavioral.
- Prefer scenario-based tests that describe user or workflow behavior over narrow internal helper assertions.
- Prefer targeted package or path-scoped validation during implementation. Do not default to full-repo `pnpm run verify` unless the user or orchestrator explicitly asks for that broader gate.
- If targeted validation fails within the bounded changed scope, do one focused repair pass. If the same bounded issue still fails afterward, stop and hand the blocker back for orchestration instead of continuing to thrash.

## Review Handoff

Before moving to `reviewing`, hand off:

- changed paths
- failing scenario-based test evidence when behavior changed
- targeted validation results
- follow-up risks or assumptions
