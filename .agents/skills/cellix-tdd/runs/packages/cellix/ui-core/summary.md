# Cellix TDD Summary

Package: `@cellix/ui-core`

Package path: `packages/cellix/ui-core`

Summary path: `.agents/skills/cellix-tdd/runs/packages/cellix/ui-core/summary.md`

## Package framing

`@cellix/ui-core` is the shared framework-level React component package for Cellix applications. This pass is an API-surface reduction and hardening effort on an existing package: the package purpose is sound, but the public contract, maintainer docs, and package-level validation were not mature enough for public-facing use.

## Consumer usage exploration

The main consumers are application and package authors who need reusable UI building blocks without inheriting app-specific concerns. The most important success paths are rendering stable loading and error states through `ComponentQueryLoader` and protecting authenticated UI branches through `RequireAuth`. The most important edge cases are auth loading, auth failure, unauthenticated redirect behavior, and ensuring consumers only depend on the root package contract instead of internal component paths.

## Contract gate summary

- `ComponentQueryLoader` remains a root export for consistent loading, error, success, and empty-state handling in query-backed UI.
- `RequireAuth` remains a root export for guarding protected UI branches behind the current OIDC auth state.
- `./components/*` was flagged for removal because it exposed file-structure-driven deep paths rather than a stable, intentional consumer contract.

Primary success-path snippet:

```tsx
import { ComponentQueryLoader, RequireAuth } from '@cellix/ui-core';
```

Human review was required because `manifest.md` was missing and narrowing the surface removed an existing export path. The user approved a root-first contract with no wildcard deep exports for now.

## Public contract

The supported public surface is the package root import, `@cellix/ui-core`. Consumers should rely on `ComponentQueryLoader` for observable loading, error, success, and empty-state rendering, and on `RequireAuth` for loading, authenticated, auth-error, and unauthenticated redirect behavior. Internal component directories, stories, and any future groupings under `components/**` remain internal until a stable, documented subpath is explicitly added.

## Test plan

Add package-level tests that import from `@cellix/ui-core` only. Group the tests by exported member so the suite makes the public surface obvious: `ComponentQueryLoader` covers data and error fallback behavior, while `RequireAuth` covers loading, authenticated, auth-error, and unauthenticated redirect states. Keep tests at the public root contract and avoid direct imports of component files.

## Changes made

Removed the wildcard `./components/*` export from `package.json`, added `manifest.md`, added a dedicated `tsconfig.vitest.json`, excluded stories and tests from the build config, aliased `@cellix/ui-core` to the root source entry in Vitest, added package-level public-contract tests grouped by exported member, and expanded the exported-component TSDoc. The README was rewritten to describe the root-only contract as a standalone package rather than as a repo-specific sample dependency.

## Documentation updates

Created `manifest.md` with purpose, boundaries, testing, and release-readiness standards. Reworked `README.md` to stay consumer-facing, to document root-only imports, and to describe the package as a standalone React dependency instead of framing it around sample applications. Expanded the TSDoc for `ComponentQueryLoader` and `RequireAuth` with usage examples, parameter details, side effects, and return-shape guidance so editor-facing API docs match the public surface more closely.

## Release hardening notes

Reviewed the export surface and reduced it to the root-only public entrypoint. Removing `./components/*` is a breaking surface narrowing in principle, but the monorepo check found only root imports and no current downstream use of `@cellix/ui-core/...` subpaths. Remaining release risk is behavioral ambiguity in `RequireAuth`, especially around how `forceLogin` influences redirect behavior; that should receive a dedicated follow-up before treating the package as broadly release-ready.

## Validation performed

Validated the package contract with `pnpm --filter @cellix/ui-core test`, confirmed the package still builds with `pnpm --filter @cellix/ui-core build`, rebuilt the full workspace with `pnpm build`, re-ran the existing workspace test suite with `pnpm test`, and used `pnpm run skill:cellix-tdd:check -- --package packages/cellix/ui-core` to verify the resulting artifacts against the Cellix TDD rubric. I also manually inspected monorepo imports to confirm current consumers use the root entrypoint rather than deep subpaths. The package and workspace commands passed. The remaining known verification gap is not a failing test but an existing `RequireAuth` render-time React warning that still warrants follow-up before broader release confidence.
