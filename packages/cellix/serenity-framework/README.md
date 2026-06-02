# @cellix/serenity-framework

Reusable Serenity/JS verification framework primitives for Cellix packages.

This package is intentionally app-agnostic. It provides adapters, a generic Serenity cast, Cucumber utilities, managed worlds, and server lifecycle infrastructure; consumers provide page objects, selectors, app paths, schemas, services, seed data, and environment-specific values.

## Page adapters

Page objects should depend on `PageAdapter`, not directly on jsdom or Playwright:

```ts
import { AdapterBackedPageObject, type PageAdapter } from '@cellix/serenity-framework/pages';

class CommunityPage extends AdapterBackedPageObject {
  constructor(adapter: PageAdapter) {
    super(adapter);
  }

  async createCommunity(name: string): Promise<void> {
    await this.adapter.getByPlaceholder('Name').fill(name);
    await this.adapter.getByRole('button', { name: /Create/i }).click();
  }
}
```

Use the runtime-specific adapter at the edge of the test package:

```ts
import { JsdomPageAdapter } from '@cellix/serenity-framework/pages/jsdom';
import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
```

## Server composition

Use generic server descriptors for app-specific processes, then load them into the suite infrastructure manager instead of hand-writing suite startup code.

```ts
import { E2EInfrastructure } from '@cellix/serenity-framework/infrastructure/e2e';
import { ApiTestServer, AuthTestServer, AzuriteTestServer, UiPortalTestServer } from '@cellix/serenity-framework/servers';

const communityPortal = new UiPortalTestServer({
  portalName: 'community',
  cwd: '/repo/apps/ui-community',
  getUrl: () => 'https://community.localhost:1355',
  spawnArgs: ['run', process.env.WORKTREE_NAME ? 'dev:worktree' : 'dev'],
});

export const infrastructure = E2EInfrastructure
  .using({
    mongoServer: { dbName, port, replSetName, seedData },
    azuriteServer,
    authServer,
    createApiServer: ({ getMongoConnectionString }) =>
      new ApiTestServer({
        serverName: 'Api',
        executable: 'pnpm',
        spawnArgs: ['run', process.env.WORKTREE_NAME ? 'dev:worktree' : 'dev'],
        cwd: '/repo/apps/api',
        extraEnv: () => ({ COSMOSDB_CONNECTION_STRING: getMongoConnectionString() }),
        getUrl: () => 'https://api.localhost:1355/api/graphql',
        readyMarker: 'Functions:',
      }),
    launchBrowser: () => playwright.chromium.launch({ headless: true }),
  })
  .addUiPortal('community', communityPortal)
  .addUiPortal('staff', staffPortal);

await infrastructure.ensureStarted();
await infrastructure.resetScenarioState();
await infrastructure.stopAll();
```

The framework never imports app paths or app-specific environment helpers. Pass those values into descriptors from the consumer package.

## API acceptance infrastructure

API-only acceptance suites use the smaller infrastructure manager. It requires MongoDB options and an API server factory, and owns startup, URL state, reset, and shutdown. If the API needs a Mongoose service, pass a factory that returns the consumer's Mongoose-compatible service; the framework starts it, clears registered models, and stops it.

```ts
import { ApiInfrastructure } from '@cellix/serenity-framework/infrastructure/api';
import { ApolloGraphQLTestServer } from '@cellix/serenity-framework/servers';

export const infrastructure = ApiInfrastructure.using({
  mongoServer: { dbName, port, replSetName, seedData },
  mongoose: {
    createService: (connectionString) => createMongooseService(connectionString),
  },
  createApiServer: ({ getMongooseService }) =>
    new ApolloGraphQLTestServer({
      schema,
      context: () => createContext(getMongooseService()),
    }),
});
```

## Managed worlds

Use a managed world when the suite does not need custom Cucumber world methods. The framework starts infrastructure, validates state, engages the cast, and resets scenario state.

```ts
import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { registerManagedSerenityWorld } from '@cellix/serenity-framework/cucumber';
import { SerenityCast } from '@cellix/serenity-framework/serenity';

export const ApiWorld = registerManagedSerenityWorld({
  infrastructure,
  validateState: (state) => {
    if (!state.apiUrl) throw new Error('API URL was not initialized');
  },
  createCast: (state) =>
    new SerenityCast({
      useNotepad: true,
      abilities: [() => new GraphQLClient({ apiUrl: state.apiUrl ?? '' })],
    }),
});
```

## jsdom helpers

Component-level acceptance tests can import framework jsdom setup and asset-loader hooks instead of carrying per-suite copies:

```sh
NODE_OPTIONS='--import tsx/esm --import @cellix/serenity-framework/jsdom/register-asset-loader' cucumber-js
```

```ts
import '@cellix/serenity-framework/jsdom/setup';
/// Include `@cellix/serenity-framework/src/jsdom/css-module-types.d.ts`
/// in tsconfig when component imports include CSS modules.
import { mountComponent, unmountComponent } from '@cellix/serenity-framework/jsdom/react-render';
```
