---
name: serenity-tests
description: Write, review, explain, or set up CellixJS Serenity/JS verification tests. Use for Cucumber Screenplay tests, @cellix/serenity-framework usage, PageAdapter/page-object patterns, acceptance-api setup or test authoring, acceptance-ui DOM/component acceptance setup or test authoring, and e2e Playwright browser setup or test authoring.
---

# Serenity Tests

Use this skill when working with CellixJS verification suites that follow the Serenity/JS Screenplay pattern. The source of truth for these patterns is PR `CellixJs/cellixjs#267`; do not copy that PR into another branch, but use its structure as the reference model.

## Core Model

- Keep business intent in shared `.feature` files and map steps to Screenplay actors, tasks, questions, abilities, and notes.
- Keep `@cellix/serenity-framework` generic. It owns reusable Serenity, Cucumber, page-adapter, DOM render, screenshot, GraphQL client, timeout, and server-lifecycle primitives.
- Keep application-specific concerns in consumer packages: selectors, page objects, app paths, environment variables, seed data, server construction, GraphQL operations, and Cucumber steps.
- Prefer page objects backed by `PageAdapter` so DOM acceptance and Playwright E2E can share page contracts.
- Prefer actor notes for scenario-local state such as created IDs, validation errors, submitted flags, and displayed names.
- Register managed worlds and lifecycle hooks at the test-package edge; do not put Cucumber step definitions in the framework package.

## Suite Selection

Read only the relevant reference files:

- **API acceptance setup:** read `references/acceptance-api/setup.md`.
- **API acceptance test writing:** read `references/acceptance-api/writing-tests.md`.
- **DOM/component acceptance setup:** read `references/acceptance-ui/setup.md`.
- **DOM/component acceptance test writing:** read `references/acceptance-ui/writing-tests.md`.
- **Browser E2E setup:** read `references/e2e/setup.md`.
- **Browser E2E test writing:** read `references/e2e/writing-tests.md`.
- **Shared page objects and page adapters:** read `references/page-objects/pattern.md`.

## Shared Conventions

- Use catalog versions for `@cucumber/*` and `@serenity-js/*` dependencies.
- Use `NODE_OPTIONS='--import tsx/esm'` for TypeScript Cucumber packages.
- Use the framework agent formatter when `std-env` reports agent execution; otherwise use the progress formatter plus JSON/HTML reports.
- Set `parallel: 1` for acceptance suites unless a package explicitly supports more concurrency.
- Set browser E2E parallelism to `0` when shared proxy or per-worktree ports would collide.
- Use `GherkinDataTable.from(dataTable).rowsHash<T>()` to turn Cucumber tables into typed details.
- Use `ActorName.resolve` when a then-step accepts an actor name but should fall back to the last actor in the scenario.
- Validate infrastructure state in `registerManagedSerenityWorld` before building the cast.
- Call `world.init()` in `Before`, `world.cleanup()` in `After` when the suite owns cleanup, and `infrastructure.stopAll()` in `AfterAll` for process-backed suites.

## Validation

For a setup change, run the narrow package command first:

- API acceptance: `pnpm --filter @ocom-verification/acceptance-api test:acceptance`
- UI acceptance: `pnpm --filter @ocom-verification/acceptance-ui test:acceptance`
- E2E: `pnpm --filter @ocom-verification/e2e-tests test:e2e`

For shared framework changes, also build or test `@cellix/serenity-framework` and affected verification packages.
