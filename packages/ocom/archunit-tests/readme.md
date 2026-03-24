# @ocom/archunit-tests

Architectural fitness tests for the  application layer and the app packages that consume it.

## Purpose

This package owns architecture tests for:

- `@ocom/*` application/domain/infrastructure packages
- `@apps/*` application entrypoints and UI apps where relevant

It is intended to enforce `@ocom`-specific layering and workspace conventions without coupling those rules to the Cellix framework package set.

## What It Checks

Current rules in this package include:

- TypeScript config conventions for `packages/ocom/*`
- dependency boundaries between ocom layers
- selected UI/application dependency boundaries
- class member ordering rules in the ocom domain package
- optional code quality and metrics checks

## What It Does Not Own

This package does not own framework-wide Cellix rules.

Those belong in [`@cellix/archunit-tests`](../../cellix/archunit-tests/readme.md).

## Running the Tests

Run just this package:

```bash
pnpm --filter @ocom/archunit-tests test:coverage
```

Or as part of the repo-wide validation flow:

```bash
pnpm run test:coverage
```

## Notes

- Some metrics and naming convention checks are intentionally skipped until the team is ready to enforce them.
- The package is intentionally scoped to ocom/apps so framework and application rules can evolve independently.
