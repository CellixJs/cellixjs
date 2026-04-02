# Cellix TDD Fixtures

These fixtures give the evaluator concrete package/result bundles to score.

Each fixture directory contains:

- `prompt.md` - the scenario the skill should handle
- `agent-output.md` - the required output structure produced by the skill user
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
node --experimental-strip-types .agents/skills/cellix-tdd/evaluator/evaluate-cellix-tdd.ts --fixtures-root .agents/skills/cellix-tdd/fixtures --verify-expected
```

The fixture suite is intentionally mixed:

- the first three fixtures represent healthy outputs that should pass
- the last three fixtures contain realistic violations that should fail specific rubric checks
