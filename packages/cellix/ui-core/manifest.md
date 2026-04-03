# @cellix/ui-core Manifest

## Purpose

`@cellix/ui-core` provides reusable, application-agnostic React UI components for Cellix applications. It is the foundation layer for shared presentation concerns that should be consistent across apps without becoming tied to a single product or domain.

## Scope

- General-purpose UI components that can be reused across multiple Cellix applications
- Components that encapsulate common interaction patterns, loading states, and auth-gating presentation
- React and Ant Design based abstractions that are still broad enough to stay framework-level

## Non-goals

- Application-specific layouts, pages, workflows, or branding
- Domain-specific business logic
- Exposing the internal folder structure as part of the public API
- Premature optimization through broad deep-export surfaces

## Public API shape

- The supported public API is the package root import: `@cellix/ui-core`
- Public exports should stay intentionally small and documented
- Additional subpath exports should only be added if they represent a stable, documented grouping with a clear consumer need
- File-structure-driven wildcard exports are out of scope for the public contract

## Core concepts

- Root-first imports keep the package contract stable while still allowing bundlers to optimize usage
- Components should remain composable and application-agnostic
- Public behavior must be described through observable component states, not internal helper structure
- Storybook stories are development artifacts, not published API surface

## Package boundaries

- Internal component organization under `src/components/**` is maintainable structure, not public contract
- Storybook stories, test files, and implementation-only helpers must stay internal
- `@cellix/ui-core` may depend on React, Ant Design, routing, and auth libraries, but it should not absorb app-specific orchestration

## Dependencies / relationships

- Depends on React and Ant Design for component composition
- `RequireAuth` depends on `react-router-dom` and `react-oidc-context`
- `@ocom/ui-components` builds on top of this package for OCOM-specific UI composition
- Cellix frontend apps consume this package through the root entrypoint

## Testing strategy

- Verify public behavior through `@cellix/ui-core` root imports only
- Preserve tests for observable loading, error, redirect, and authenticated states
- Do not test through deep source imports or story files
- Use package-scoped Vitest tests with a dedicated `tsconfig.vitest.json`

## Documentation obligations

- Keep `README.md` consumer-facing and aligned with the supported root-only contract
- Keep TSDoc on meaningful public exports such as `ComponentQueryLoader` and `RequireAuth`
- Review `manifest.md`, `README.md`, and TSDoc together whenever exports or observable behavior change

## Release-readiness standards

- `package.json` exports reflect only the intended public surface
- Public components have contract tests through the root entrypoint
- Consumer docs reference the real exported components and supported usage
- Storybook and test artifacts are not treated as published API
- Any future subpath export must be explicitly justified, documented, and reviewed before release
