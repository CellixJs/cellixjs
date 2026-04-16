# Cellix Orchestration Norms

Use `orchestration.spec.yaml` as the repo-local control plane and `.agents/orchestration/model/orchestration-model.v1.json` as the shared orchestration defaults.

## Authority Order

1. `orchestration.spec.yaml`
2. ADR and architecture-policy intent
3. repo-wide and path-scoped instructions
4. skills
5. custom agents
6. runtime artifacts

Hooks validate and enforce this model, but they do not define policy on their own.

## Lane Routing

Choose one primary lane before substantial implementation:

- `reusable-framework-public-surface`
- `reusable-framework-internal`
- `application-feature-delivery`
- `tooling-workflow`
- `docs-architecture-planning`

If a task truly spans multiple lane families, split the phases or escalate instead of blending them.

## Workflow States

Follow the explicit state model:

- `initialized`
- `planning`
- `plan-complete`
- `implementing`
- `reviewing`
- `revising`
- `blocked`
- `done`

Do not skip the planning or review gates.

## Profile and Extension Rules

- `mixed-framework-and-app` supports framework, application, tooling, and docs lanes.
- `framework-only` supports framework, tooling, and docs lanes.
- `application-only` supports application, tooling, and docs lanes.
- `cellix-tdd` is only valid for reusable framework work in profiles that support framework behavior.

## Artifact Posture

Default to minimal runtime artifacts:

- `intake.md`
- `plan.md`
- `final-summary.md`

Only increase artifact depth when risk, parallelism, or profile-specific behavior justifies it.
