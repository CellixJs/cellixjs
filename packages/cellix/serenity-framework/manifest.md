# manifest.md - @cellix/serenity-framework

## Purpose

Provide reusable Serenity/JS, Cucumber, page-adapter, and test-server framework primitives that Cellix consumers can compose with app-specific pages, step definitions, services, URLs, and data.

## Scope

This package owns generic verification infrastructure only:

- Serenity task, cast, and browser-ability primitives
- Cucumber data-table, lifecycle, screenshot, and managed-world helpers
- Runtime-agnostic page adapter contracts and jsdom/Playwright adapter implementations
- jsdom globals, CSS module declarations, asset-loader hooks, and generic React render helpers for component acceptance tests
- Adapter-backed page-object base contracts
- Timeout utilities
- Configurable process, UI portal, Apollo GraphQL, Azurite, Mongo memory, and server-group lifecycle utilities
- API acceptance and browser E2E infrastructure managers that create MongoDB from options and compose consumer-owned server factories

## Non-goals

- OCOM-specific page objects, selectors, scenarios, seed data, application services, GraphQL schemas, app paths, or environment variable names
- Opinionated Cucumber step definitions
- Production server orchestration

## Public API shape

- `@cellix/serenity-framework/serenity`: `TaskStep`
- `@cellix/serenity-framework/cucumber`: `ActorName`, `GherkinDataTable`, lifecycle hook helpers
- `@cellix/serenity-framework/cucumber/screenshot`: browser screenshot-on-failure hook helpers
- `@cellix/serenity-framework/pages`: adapter contracts and page-object base types
- `@cellix/serenity-framework/pages/jsdom`: `JsdomPageAdapter`
- `@cellix/serenity-framework/pages/playwright`: `PlaywrightPageAdapter`
- `@cellix/serenity-framework/clients/graphql`: `GraphQLClient`
- `@cellix/serenity-framework/jsdom/setup`: jsdom global bootstrap side-effect module
- `@cellix/serenity-framework/jsdom/register-asset-loader`: jsdom asset-loader registration side-effect module
- `@cellix/serenity-framework/jsdom/react-render`: generic React mount/unmount helpers
- `@cellix/serenity-framework/jsdom/css-modules`: package-owned CSS module declaration target
- `@cellix/serenity-framework/serenity`: `TaskStep`, `SerenityCast`
- `@cellix/serenity-framework/serenity/browser`: `BrowseTheWeb`
- `@cellix/serenity-framework/infrastructure/api`: API acceptance infrastructure manager with MongoDB options, optional Mongoose service management, and an API server factory
- `@cellix/serenity-framework/infrastructure/e2e`: browser E2E infrastructure manager with MongoDB options, required Azurite/auth servers, an API server factory, and chainable UI portals
- `@cellix/serenity-framework/servers`: generic server lifecycle classes and interfaces
- `@cellix/serenity-framework/settings`: timeout helpers

## Package boundaries

The package must not import from `@ocom/*`, `@ocom-verification/*`, `apps/*`, or local OCOM path helpers. Consumers pass app-specific values through options objects, descriptors, factories, or callbacks.

## Dependencies / relationships

Downstream consumers in this monorepo are expected to include `@ocom-verification/acceptance-api`, `@ocom-verification/acceptance-ui`, and `@ocom-verification/e2e-tests`.

## Testing strategy

Prefer public-entrypoint tests that exercise observable behavior through sectioned exports. Do not test private implementation details or deep-import package internals.

## Documentation obligations

Keep `README.md` consumer-facing and package-centric. Meaningful public exports require TSDoc that explains purpose, options, return values, side effects, errors, and usage where helpful.

## Release-readiness standards

Build and test this package plus affected verification consumers before treating the package as ready for external npm use. Any public export removal or behavioral incompatibility requires explicit semver review.
