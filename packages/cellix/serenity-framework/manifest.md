# manifest.md - @cellix/serenity-framework

## Purpose

Provide reusable Serenity/JS, Cucumber, page-adapter, and test-server framework primitives that Cellix consumers can compose with app-specific pages, step definitions, services, URLs, and data.

## Scope

This package owns generic verification infrastructure only:

- Serenity task, cast, browser-ability, and in-process DOM render-ability primitives
- Cucumber data-table, lifecycle, screenshot, and managed-world helpers
- Runtime-agnostic page adapter contracts and in-process DOM (happy-dom) / Playwright adapter implementations
- DOM globals (via happy-dom), CSS module declarations, asset-loader hooks, and generic React render helpers for component acceptance tests
- Adapter-backed page-object base contracts
- Timeout utilities
- Configurable process, Apollo GraphQL, and Mongo memory server lifecycle utilities, including process-backed Mongo reset/seed support
- API acceptance and browser E2E infrastructure managers that compose consumer-owned server instances; the E2E manager starts a dependency-ordered regular server set, then UI portal servers, then the browser

## Non-goals

- OCOM-specific page objects, selectors, scenarios, seed data, application services, GraphQL schemas, app paths, or environment variable names
- Opinionated Cucumber step definitions
- Production server orchestration

## Public API shape

- `@cellix/serenity-framework/serenity`: `TaskStep`
- `@cellix/serenity-framework/cucumber`: `ActorName`, `GherkinDataTable`, lifecycle hook helpers
- `@cellix/serenity-framework/cucumber/screenshot`: browser screenshot-on-failure hook helpers
- `@cellix/serenity-framework/pages`: adapter contracts and page-object base types
- `@cellix/serenity-framework/pages/dom`: `DomPageAdapter`
- `@cellix/serenity-framework/pages/playwright`: `PlaywrightPageAdapter`
- `@cellix/serenity-framework/clients/graphql`: `GraphQLClient`
- `@cellix/serenity-framework/dom/setup`: DOM global bootstrap side-effect module (happy-dom)
- `@cellix/serenity-framework/dom/register-asset-loader`: asset-loader registration side-effect module
- `@cellix/serenity-framework/dom/render-in-dom`: `RenderInDom` ability and `Render` interaction for rendering components through actors
- `@cellix/serenity-framework/dom/css-modules`: package-owned CSS module declaration target
- `@cellix/serenity-framework/serenity`: `TaskStep`, `SerenityCast`
- `@cellix/serenity-framework/serenity/browser`: `BrowseTheWeb`
- `@cellix/serenity-framework/infrastructure/api`: API acceptance infrastructure manager with chainable `addServer(...).finalize()` registration and server-owned scenario reset
- `@cellix/serenity-framework/infrastructure/e2e`: browser E2E infrastructure manager that composes regular servers before UI portal servers via `addServer(...).addUiPortal(...).finalize()` and sets up the browser
- `@cellix/serenity-framework/servers`: generic server lifecycle classes and interfaces, including `UiTestServer` / `ProcessUiTestServer` for browser portal registration, process-owned fixed-port cleanup, and `MongoMemoryProcessTestServer` for process-backed Mongo startup with reset/seed behavior
- `@cellix/serenity-framework/settings`: timeout helpers

## Package boundaries

The package must not import from `@ocom/*`, `@ocom-verification/*`, `apps/*`, or local OCOM path helpers. Consumers pass app-specific values through options objects, descriptors, server instances, or callbacks.

## Dependencies / relationships

Downstream consumers in this monorepo are expected to include `@ocom-verification/acceptance-api`, `@ocom-verification/acceptance-ui`, and `@ocom-verification/e2e-tests`.

## Testing strategy

Prefer public-entrypoint tests that exercise observable behavior through sectioned exports. Do not test private implementation details or deep-import package internals.

## Documentation obligations

Keep `README.md` consumer-facing and package-centric. Meaningful public exports require TSDoc that explains purpose, options, return values, side effects, errors, and usage where helpful.

## Release-readiness standards

Build and test this package plus affected verification consumers before treating the package as ready for external npm use. Any public export removal or behavioral incompatibility requires explicit semver review.
