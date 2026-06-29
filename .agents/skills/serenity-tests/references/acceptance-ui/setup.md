# Acceptance UI Setup

Use this guide when setting up DOM/component acceptance tests. The PR #267 model is `packages/ocom-verification/acceptance-ui`.

## Purpose

The acceptance UI suite runs Cucumber Screenplay tests against React components rendered in-process with happy-dom. It verifies component behavior without launching app servers or a real browser.

## Package Shape

- Keep the package private, ESM, and TypeScript-loaded through `tsx/esm`.
- Depend on `@cellix/serenity-framework`, Cucumber, Serenity/JS packages, React, React DOM, app UI dependencies, and component provider dependencies.
- Include `@testing-library/react` as a dev dependency when component rendering depends on it.
- Use `NODE_OPTIONS` preloads for TypeScript, asset loading, and DOM globals:

```json
{
  "test:acceptance": "LOG_LEVEL=warn NODE_OPTIONS='--import tsx/esm --import @cellix/serenity-framework/dom/register-asset-loader --import @cellix/serenity-framework/dom/setup' cucumber-js",
  "test:coverage:acceptance": "LOG_LEVEL=warn NODE_OPTIONS='--import tsx/esm --import @cellix/serenity-framework/dom/register-asset-loader --import @cellix/serenity-framework/dom/setup' c8 cucumber-js"
}
```

Load `react-dom` only after the framework DOM setup preload so React binds to happy-dom.

## TypeScript

- Enable JSX, DOM libs, `allowImportingTsExtensions`, and `rewriteRelativeImportExtensions`.
- Include the framework CSS module type target when component imports use CSS modules:

```json
{
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "../../cellix/serenity-framework/src/dom/css-module-types.d.ts",
    "../../ocom/ui-community-route-root/src/**/*.tsx"
  ]
}
```

## Cucumber Config

- Use the same shared feature paths as the API and E2E suites when the business scenarios are shared.
- Import `src/world.ts` and the step-definition barrel.
- Use the agent formatter in agent runs and report to UI-specific files.
- Keep `parallel: 1` unless the rendered component setup is proven isolated.

## World And Cast

- Use a managed world with a minimal infrastructure object because no external process is required.
- Give actors the `RenderInDom` ability.

```ts
export const CellixUiWorld = registerManagedSerenityWorld<Record<string, never>>({
  infrastructure: {
    ensureStarted: () => Promise.resolve(),
    getState: () => ({}),
  },
  createCast: () =>
    new SerenityCast({
      useNotepad: true,
      abilities: [() => new RenderInDom()],
    }),
});
```

## Hooks

- Register `world.init()` in `Before`.
- Use `RenderInDom.as(actorInTheSpotlight()).unmount()` in an `After` hook to clean up rendered components.
- Ignore cleanup errors when a scenario did not render a component.

## Component Wrappers

- Keep app providers in a small package-owned wrapper helper, for example Apollo `MockedProvider`, Helmet, Ant Design `ConfigProvider`, and `App`.
- Pass mocks or provider options into that wrapper from step definitions.
- Do not bake OCOM providers into `@cellix/serenity-framework`; it should only provide generic render primitives.
