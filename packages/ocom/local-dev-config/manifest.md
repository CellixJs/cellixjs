# manifest.md - @ocom/local-dev-config

## Purpose

Provide Owner Community local-development URL and hostname policy as a reusable package, while delegating generic local-development mechanics to `@cellix/local-dev`.

## Scope

This package resolves OCOM hostnames from app `.env` files and environment overrides, applies the shared hostname suffixing helper from `@cellix/local-dev`, and builds the complete local URL set needed by UI, API, mock-auth, docs, e2e, and other build-time consumers.

## Non-goals

- Generic process runners, port math, JSON syncing, or dotenv parsing
- Production runtime configuration
- Non-OCOM app defaults
- Generic local dev process orchestration

## Public API shape

Published entrypoints:

- `@ocom/local-dev-config`
- `@ocom/local-dev-config/hostnames`
- `@ocom/local-dev-config/urls`

Root entrypoint exports:

- `getOcomHostnames(options?)`
- `buildOcomUrls(options?)`
- `buildOcomApiLocalSettings(options?)`
- `OcomLocalDevOptions`
- `OcomHostnames`
- `OcomUrls`

## Core concepts

- OCOM app wrappers should use this package to get OCOM URL values, then pass those values into generic `@cellix/local-dev` worktree-aware runners or settings syncers.
- Environment values override app `.env` file values so task runners can inject per-process configuration.
- Worktree suffixing, Mongo ports, Azurite ports, and settings-file connection-string transforms are delegated to `@cellix/local-dev` so all participating apps share one rule.

## Package boundaries

- App-specific auth paths and redirect paths are allowed here because they are OCOM local-dev policy.
- Generic local-development primitives must not be reimplemented here.
- One-off behavior for a single app should stay in that app's wrapper script unless at least two OCOM consumers need the same policy.

## Dependencies / relationships

- Depends on `@cellix/local-dev`
- Downstream consumers in this branch: `@apps/api`, `@apps/ui-community`, `@apps/ui-staff`, and `@apps/server-oauth2-mock`

## Testing strategy

- Test through the package entrypoint.
- Prove hostnames are derived from fixture app `.env` files, environment overrides take precedence, worktree suffixes are applied safely without duplication, and the full URL contract remains stable.

## Documentation obligations

- Keep `README.md` consumer-facing and focused on app-wrapper usage.
- Keep this manifest aligned with the exported package contract and OCOM-specific boundaries.
- Maintain TSDoc on exported helpers and public option/result types.

## Release-readiness standards

- Package build and tests must pass.
- The public surface should remain small and policy-focused.
- Any expansion of exported URL fields should be justified by a real app-wrapper consumer.
