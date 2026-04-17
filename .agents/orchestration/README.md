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

The Copilot CLI workflow is now primarily enforced by `.github/hooks/workflow-enforcement.json` and the agent prompts in `.github/agents/`.

The current runtime is checkpoint-driven:

- `sessionStart` initializes `.agents-work/current/`
- `preToolUse` gates planner -> implementor -> reviewer order
- `postToolUse` reconciles `plan.md`, `implementer.done`, `review.ok`, and `review.feedback` from delegate results when background-agent file writes are not visible in the parent workspace

Use the utilities in this directory for:

- repo path-class routing
- lane suggestion
- offline validation of `orchestration.spec.yaml`
- docs and model defaults

The CLI commands here are helper utilities, not the main execution engine for Copilot runs. The preferred run path is:

1. `/agents`
2. select `orchestrator`
3. give the task prompt
4. let the checkpoint hooks enforce `planner -> implementor -> reviewer`

## Validation Commands

- `pnpm run orchestration:validate` validates the repo-local orchestration spec, model wiring, required skills, agents, and hook manifest.
- `pnpm run test:orchestration` runs the orchestration validator/runtime/hook unit tests.
- `pnpm run orchestration:suggest-lane -- <path>...` remains useful as an offline helper when you want to confirm a lane guess from concrete paths.
- `node --experimental-strip-types .agents/orchestration/cli/validate-orchestration.ts --repo . --spec .agents/orchestration/examples/framework-only.orchestration.spec.yaml` validates an alternate repo-local spec such as the framework-only or application-only examples.

The older `.agents/orchestration` CLI runtime remains in the repo for validation and offline tooling, but the recommended Copilot path is the simpler `.github/hooks` checkpoint workflow.
