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
- Bootstrap usually performs the `initialized -> planning` transition for you. After that, prefer checkpoint-driven handoffs instead of raw transition choreography.
- Use `pnpm run orchestration:session-status -- --session <session-id>` to inspect bounded changed paths, the canonical session directory, checkpoint paths, and the recommended next step.
- Discovery planning must write `.agents-work/orchestration/sessions/<session-id>/plan.md`.
- Once `plan.md` exists, run `pnpm run orchestration:hook -- handoff implementing --session <session-id> --role senior-orchestrator` to advance automatically through `plan-complete` into `implementing`.
- Keep implementation delegation narrow: pass the session id, changed-path scope, and canonical plan/session paths, then let the implementation agent read `plan.md` instead of embedding the whole plan again.
- Prefer targeted validation during `implementing`. The implementation agent should write `.agents-work/orchestration/sessions/<session-id>/implementation/result.md`, and the orchestrator should use `pnpm run orchestration:hook -- handoff reviewing --session <session-id> --role senior-orchestrator` to enter review.
- The reviewer should write `.agents-work/orchestration/sessions/<session-id>/review/decision.md`; the orchestrator then resolves the review with `pnpm run orchestration:hook -- complete done|revising --session <session-id> --role senior-orchestrator`.
- If a bounded implementation failure occurs within the changed scope, allow one focused repair pass. If it still fails, stop and surface the blocker instead of continuing an open-ended fix loop.

## Validation Commands

- `pnpm run orchestration:bootstrap -- --session <session-id> <changed-path>...` resolves changed paths through the repo-local orchestration spec and starts a planning session when the lane is explicit.
- `pnpm run orchestration:session-status -- --session <session-id>` reports the current session state, stored changed paths, canonical session/phase directories, checkpoint files, and the recommended next step.
- `pnpm run orchestration:validate` validates the repo-local orchestration spec, model wiring, required skills, agents, and hook manifest.
- `pnpm run orchestration:suggest-lane -- <changed-path>...` suggests a likely primary lane from changed paths and surfaces ambiguous cases that still need orchestrator judgment.
- `node --experimental-strip-types .agents/orchestration/cli/validate-orchestration.ts --repo . --spec .agents/orchestration/examples/framework-only.orchestration.spec.yaml` validates an alternate repo-local spec such as the framework-only or application-only examples.
- `pnpm run test:orchestration` runs the orchestration validator/runtime/hook unit tests.
- `pnpm run orchestration:hook -- handoff implementing|reviewing ...` advances into the next execution phase when the canonical checkpoint artifacts exist.
- `pnpm run orchestration:hook -- complete done|revising|blocked ...` resolves the reviewing phase without manually supplying evidence keys.
- `pnpm run orchestration:hook -- <subcommand> ...` still exposes lower-level compatibility hooks such as `session-init`, `transition`, `agent-check`, `tool-check`, `evidence-log`, and `blocked`.
