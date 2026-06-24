# E2E Setup

Use this guide when setting up browser-backed Cucumber Screenplay tests. The PR #267 model is `packages/ocom-verification/e2e-tests`.

## Purpose

The E2E suite runs shared business scenarios through real app processes and a Playwright browser. It composes Mongo, Azurite, OAuth2, API, and UI portal servers through `@cellix/serenity-framework`.

## Package Shape

- Keep the package private, ESM, and TypeScript-loaded by `tsx/esm`.
- Depend on `@cellix/serenity-framework`, Cucumber, Serenity/JS packages, and `std-env`.
- Keep Playwright in dev dependencies and provide a `playwright:install` script.
- Start the portless proxy before Cucumber and use the local CA when needed:

```json
{
  "test:e2e": "pnpm run portless:prune && pnpm run proxy:start && pnpm run test:e2e:run",
  "test:e2e:ci": "pnpm run portless:prune && pnpm run proxy:start:ci && pnpm run test:e2e:run",
  "test:e2e:run": "NODE_EXTRA_CA_CERTS=${HOME}/.portless/ca.pem LOG_LEVEL=warn NODE_OPTIONS='--import tsx/esm' cucumber-js"
}
```

## Cucumber Config

- Use shared feature paths when the same scenarios drive API, component, and browser verification.
- Import `src/world.ts` and one step-definition barrel.
- Use the agent formatter during agent runs and JSON/HTML reports for artifacts.
- Set `parallel: 0` when the shared portless proxy and per-worktree ports make parallel browsers contend for the same hostnames.

## Infrastructure

- Use `E2EInfrastructure`.
- Put app-specific environment setup and cleanup in consumer-owned helpers such as `initTestEnvironment` and `cleanupTestEnvironment`.
- Register non-UI servers first with `addServer`.
- Register UI portals with `addUiPortal` after regular servers.
- Use `dependsOn` for startup ordering only; pass real object references through constructors when one server needs another.

```ts
export const infrastructure = E2EInfrastructure.create({
  browserContextOptions: { ignoreHTTPSErrors: true },
  cleanupEnvironment: cleanupTestEnvironment,
  setupEnvironment: initTestEnvironment,
})
  .addServer('mongo', testMongoServer)
  .addServer('azurite', testAzuriteServer)
  .addServer('auth', testOAuth2Server)
  .addServer('api', testApiServer, { dependsOn: ['mongo', 'azurite', 'auth'] })
  .addUiPortal('community', communityUiPortalServer, { dependsOn: ['api', 'auth'] })
  .addUiPortal('staff', staffUiPortalServer, { dependsOn: ['api', 'auth'] })
  .finalize();
```

## World And Cast

- Validate that `state.browseTheWeb` exists.
- Give actors the `BrowseTheWeb` ability from infrastructure state.
- Add app-specific abilities such as OAuth2 login through protected routes.

```ts
export const CellixE2EWorld = registerManagedSerenityWorld({
  infrastructure,
  validateState: (state) => {
    if (!state.browseTheWeb) throw new Error('BrowseTheWeb ability not initialized');
  },
  createCast: (state) =>
    new SerenityCast({
      useNotepad: true,
      abilities: [() => state.browseTheWeb!, () => OAuth2Login.throughProtectedRoute('/community/accounts')],
    }),
});
```

## Hooks And Screenshots

- Register `world.init()` before scenarios, `world.cleanup()` after scenarios, and `infrastructure.stopAll()` in `AfterAll`.
- Register screenshot-on-failure to a package-local reports directory.

## Turborepo

- Add `test:e2e`, `test:e2e:ci`, and `test:serenity` tasks.
- Depend on `^build`.
- Include app local settings, `.env.e2e`, local-dev scripts, Cucumber config, and source files in inputs.
- Keep E2E tasks uncached.
