# Cellix Orchestration Control Plane

This directory defines the portable control-plane contract for the Cellix orchestration workflow introduced by issue `#218`.

## Files

- `model/orchestration-model.v1.json` contains the machine-readable defaults for capability profiles, lane families, workflow states, role allowlists, authority order, artifact depth, and framework-oriented extensions.
- `schema/orchestration-spec.schema.json` defines the lightweight repo-local `orchestration.spec.yaml` format.
- `examples/*.orchestration.spec.yaml` shows how the same orchestration core is adopted by framework-only and application-only repositories.

## Design Intent

The orchestration spec stays intentionally small:

- each repo declares its orchestration `version`
- each repo selects one capability `profile`
- each repo maps its own paths/packages into abstract `classes`
- each repo uses `overrides` only when deviating from profile defaults

Everything else comes from the shared orchestration model so downstream repos do not have to restate lane families, skills, agents, hooks, or completion behavior by hand.

## Control-Plane Layers

The model defines this authority order:

1. repo-local orchestration spec
2. ADR or architecture policy intent
3. repo-wide and path-scoped instructions
4. skills
5. thin role agents
6. runtime artifacts

Hooks and validators enforce the model, but they do not invent policy outside these layers.

## Current Repo Adoption

The CellixJS mixed-repository example lives at the repo root in `orchestration.spec.yaml`.

## Supported Bootstrap

The supported startup path is explicit orchestrator selection.

- In Copilot CLI, select the `senior-orchestrator` agent first, then provide the task prompt.
- After that, bootstrap the run from the concrete changed paths or expected paths:
- Prefer the concrete task paths from the prompt or issue over a raw branch diff when the branch already includes unrelated orchestration, tooling, or documentation changes.

```bash
pnpm run orchestration:bootstrap -- --session <session-id> <changed-path>...
```

- If the bootstrap report returns a clean lane, the helper creates the session and advances it into `planning`.
- The bootstrap output now prints the canonical `plan.md` artifact path for the session.
- If the bootstrap report returns `Requires lane decision: yes`, stop and choose a lane explicitly instead of continuing with an assumed one.
- If the bootstrap report says the paths span both `reusableFramework` and `applicationPackages`, split the work into bounded phases or escalate instead of forcing one lane.
- If the selected lane is reusable-framework work, the bootstrap report also surfaces `cellix-tdd` as the framework extension to carry into planning and implementation.
- Bootstrap usually performs the `initialized -> planning` transition for you, so the common shorthand `pnpm run orchestration:hook -- transition planning --session <session-id> --role senior-orchestrator` should only be used when bootstrap did not already move the session into `planning`.
- Use `pnpm run orchestration:session-status -- --session <session-id>` to inspect bounded changed paths and required artifact status.
- Discovery planning must write `.agents-work/orchestration/sessions/<session-id>/plan.md`; `transition plan-complete` now refuses to advance if that artifact is missing.

## Validation Commands

- `pnpm run orchestration:bootstrap -- --session <session-id> <changed-path>...` resolves changed paths through the repo-local orchestration spec and starts a planning session when the lane is explicit.
- `pnpm run orchestration:session-status -- --session <session-id>` reports the current session state, stored changed paths, and whether `intake.md`, `plan.md`, and `final-summary.md` exist at their canonical session paths.
- `pnpm run orchestration:validate` validates the repo-local orchestration spec, model wiring, required skills, agents, and hook manifest.
- `pnpm run orchestration:suggest-lane -- <changed-path>...` suggests a likely primary lane from changed paths and surfaces ambiguous cases that still need orchestrator judgment.
- `node --experimental-strip-types .agents/orchestration/cli/validate-orchestration.ts --repo . --spec .agents/orchestration/examples/framework-only.orchestration.spec.yaml` validates an alternate repo-local spec such as the framework-only or application-only examples.
- `pnpm run test:orchestration` runs the orchestration validator/runtime/hook unit tests.
- `pnpm run orchestration:hook -- <subcommand> ...` runs the first-pass hook runtime for session init, transitions, agent checks, tool checks, evidence logging, and blocked handling.
