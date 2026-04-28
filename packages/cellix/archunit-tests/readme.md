# @cellix/archunit-tests

Architectural fitness tests for the reusable Cellix framework packages.

## Purpose

This package owns architecture tests for the `@cellix/*` framework layer.

It exists to keep framework-level conventions separate from `@ocom/*` application rules so the Cellix platform can evolve as a reusable internal framework with its own guardrails.

## What It Checks

Current rules in this package include:

- TypeScript compiler output conventions for `packages/cellix/*`
- circular dependency checks across Cellix package source graphs
- framework boundary checks, such as `ui-core` not depending on OCom UI code or app code

## What It Does Not Own

This package does not enforce OCom application-layer rules.

Those belong in [`@ocom/archunit-tests`](../../ocom/archunit-tests/readme.md).

## Running the Tests

Run just this package:

```bash
pnpm --filter @cellix/archunit-tests test
```

Or as part of the repo-wide validation flow:

```bash
pnpm run test:arch
```

## Notes

- The rules in this package should stay framework-focused and avoid application-specific assumptions where possible.
- If a new Cellix package intentionally breaks the standard compiled-library shape, add a narrow exception in the relevant test rather than broadening the rule.
- This package is intentionally excluded from coverage gates; coverage expectations apply to consumer app/framework packages.
