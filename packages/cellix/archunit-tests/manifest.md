# @cellix/archunit-tests

## Purpose

Publish reusable architectural fitness checks and Vitest suites that Cellix applications can run against their own source, and host architecture tests for `@cellix/*` packages.

## Scope

- Parameterized `check*` scanners that return violation strings
- Matching `describe*Tests` Vitest suites for drop-in consumption
- Framework-layer conventions (compiler output, circular dependencies, UI isolation, domain/persistence/graphql/frontend shapes that Cellix standardizes)

## Non-goals

- Application-specific overlay rules (portal registries, owner groups, evidence artifacts)
- Replacing package unit tests or runtime validation
- Custom lint rules inside Biome

## Public API shape

Subpath exports (`./frontend`, `./domain`, `./general`, and related) re-export `check*` functions, `describe*Tests` functions, and their config types. Consumers should import from those subpaths, not from `src/` internals.

## Core concepts

- A `check*` is test-runner agnostic. A `describe*Tests` function is a Vitest wrapper around one or more checks.
- Rules that other Cellix adopters need must take scan paths or globs as config rather than assuming this monorepo's layout.

## Package boundaries

`checks/`, `test-suites/`, and `utils/` are internal except through the documented subpath barrels.

## Dependencies / relationships

- Consumed by `@ocom-verification/archunit-tests` and by `@ocom/ui-*` packages
- Uses `archunit` and the TypeScript compiler API
- Extends `@cellix/config-typescript` and `@cellix/config-vitest`

## Testing strategy

Public behavior is verified through the subpath barrels. New checks need fixture or temp-directory contract tests covering allowed input, each violation class, and ignored comments/strings.

## Documentation obligations

README stays consumer-facing (how to import and run suites). This manifest records package boundaries. Public `check*` and `describe*Tests` functions need TSDoc with at least one usage example.

## Release-readiness standards

The package is currently `private`. Additive exports are the compatibility bar for in-monorepo and other Cellix adopters. Do not rename or remove exported suite helpers without a migration path.
