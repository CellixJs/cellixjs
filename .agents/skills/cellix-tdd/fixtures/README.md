# Cellix TDD Fixtures

These fixtures give the evaluator concrete package/result bundles to score.

Each fixture directory contains:

- `prompt.md` - the scenario the skill should handle
- `agent-output.md` - the required output structure produced by the skill user, including `Contract gate summary`
- `package/` - a small `@cellix/*` package snapshot to evaluate
- `expected-report.json` - the expected overall status and failing checks for self-test

## Included Scenarios

- `existing-package-add-feature`
- `existing-package-internal-refactor`
- `new-package-greenfield`
- `docs-lagging-implementation`
- `leaky-overbroad-api`
- `tempting-internal-helper`

## Run the Fixture Suite

```bash
pnpm run test:skill:cellix-tdd
```

The fixture suite is intentionally mixed:

- the first three fixtures represent healthy outputs that should pass
- the last three fixtures contain realistic violations that should fail specific rubric checks

## Evaluate a Real Package

```bash
pnpm run skill:cellix-tdd:check -- --package packages/cellix/my-package
```

By default, the summary is created at:

```text
.agents/skills/cellix-tdd/runs/<relative-package-path>/summary.md
```

The generated summary is intentionally a failing scaffold until its `TODO:` sections are replaced with real package-specific content.

Useful flags:

- `--output /path/to/summary.md`
- `--init-only`
- `--force-init`
- `--json`
