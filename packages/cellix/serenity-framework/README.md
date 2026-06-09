# @cellix/serenity-framework

Reusable Serenity/JS verification framework primitives for Cellix packages.

This package is intentionally app-agnostic. It provides adapters, a generic Serenity cast, Cucumber utilities, managed worlds, and server lifecycle infrastructure; consumers provide page objects, selectors, app paths, schemas, services, seed data, and environment-specific values.

## Page adapters

Page objects should depend on `PageAdapter`, not directly on happy-dom or Playwright:

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
import { DomPageAdapter } from '@cellix/serenity-framework/pages/dom';
import { PlaywrightPageAdapter } from '@cellix/serenity-framework/pages/playwright';
```

## Server composition

Compose only the servers a suite needs by chaining `addServer`, then `addUiPortal`, then `finalize`. The framework starts them in dependency order (servers whose `dependsOn` is satisfied start in parallel), calls `resetForScenario()` on servers that implement it, sets up the browser when a UI portal exists, and tears everything down. Each application registers its own set — fewer or more servers — without changing the framework. Once UI portal registration starts, regular server registration is closed; once finalized, no registration methods remain on the typed runtime surface.

```ts
import { E2EInfrastructure } from '@cellix/serenity-framework/infrastructure/e2e';
import { MongoMemoryProcessTestServer, ProcessTestServer, ProcessUiTestServer } from '@cellix/serenity-framework/servers';

const mongo = new MongoMemoryProcessTestServer({
  serverName: 'Mongo',
  executable: 'pnpm',
  spawnArgs: ['run', 'dev'],
  cwd: '/repo/apps/server-mongodb-memory-mock',
  connectionString: () => mongoConnectionString,
  dbName,
  portsToCloseBeforeStart: () => mongoPort,
  readyMarker: 'MongoDB Memory Replica Set ready at:',
  seedData,
});

const api = new ProcessTestServer({
  serverName: 'Api',
  executable: 'pnpm',
  spawnArgs: ['run', process.env.WORKTREE_NAME ? 'dev:worktree' : 'dev'],
  cwd: '/repo/apps/api',
  extraEnv: () => ({ COSMOSDB_CONNECTION_STRING: mongo.getConnectionString() }),
  getUrl: () => 'https://api.localhost:1355/api/graphql',
  readyMarker: 'Functions:',
});

const community = new ProcessUiTestServer({
  serverName: 'Community portal',
  executable: 'pnpm',
  spawnArgs: ['run', 'dev'],
  cwd: '/repo/apps/ui-community',
  getUrl: () => 'https://community.localhost:1355',
  readyMarker: 'ready in',
});

export const infrastructure = E2EInfrastructure
  .create({
    // Shared across every portal context; baseURL is supplied per portal.
    browserContextOptions: { ignoreHTTPSErrors: true },
  })
  .addServer('mongo', mongo)
  .addServer('auth', createAuthServer())
  .addServer('api', api, { dependsOn: ['mongo'] })
  .addUiPortal('community', community)
  .addUiPortal('staff', createStaffPortal())
  .finalize();

await infrastructure.ensureStarted();
await infrastructure.resetScenarioState();
await infrastructure.stopAll();

// Each portal carries its own context recipe — baseURL is that portal's URL —
// so a scenario opens a context for whichever portal it needs, symmetrically:
const staffContext = await infrastructure.newPortalContext('staff');
```

Register server objects directly. Dependencies that need one another receive those references through normal object construction; `dependsOn` describes startup order only. Each UI portal owns its browser-context recipe, so `newPortalContext(name)` scopes navigation to that portal without any portal being special-cased. The framework never imports app paths or app-specific environment helpers — pass those into server constructors from the consumer package.

## API acceptance infrastructure

API-only acceptance suites use the smaller infrastructure manager. It composes any consumer-owned `TestServer` implementations without launching a browser, and owns dependency-ordered startup, scenario reset, and shutdown.

```ts
import { ApiInfrastructure } from '@cellix/serenity-framework/infrastructure/api';
import { MongoMemoryProcessTestServer } from '@cellix/serenity-framework/servers';

const mongo = new MongoMemoryProcessTestServer({ serverName, executable, spawnArgs, cwd, connectionString, dbName, portsToCloseBeforeStart: mongoPort, readyMarker, seedData });
const graphql = createGraphqlServer(mongo);

export const infrastructure = ApiInfrastructure
  .create()
  .addServer('mongo', mongo)
  .addServer('graphql', graphql, { dependsOn: ['mongo'] })
  .finalize();

// Suites without a database can register only their API server.
const apiOnly = ApiInfrastructure.create()
  .addServer('graphql', createGraphqlServer())
  .finalize();
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

## DOM (happy-dom) helpers

Component-level acceptance tests run against an in-process DOM provided by
happy-dom. Preload the DOM setup and asset-loader hooks before any module that
imports `react-dom`, so React binds its event system to the happy-dom
environment. Both run as Node `--import` preloads, which is order-independent:

```sh
NODE_OPTIONS='--import tsx/esm --import @cellix/serenity-framework/dom/register-asset-loader --import @cellix/serenity-framework/dom/setup' cucumber-js
```

Include `@cellix/serenity-framework/src/dom/css-module-types.d.ts` in tsconfig
when component imports include CSS modules.

## Rendering components through actors

Give actors the `RenderInDom` ability and let page objects read their root
element from the actor, instead of threading a container through world state or
task parameters. This is the in-process DOM counterpart to a browser
`BrowseTheWeb` ability, so component acceptance tests and browser E2E tests share
the same actor-centric shape. The ability unmounts the rendered tree when the
scenario ends.

```ts
import { Render, RenderInDom } from '@cellix/serenity-framework/dom/render-in-dom';
import { DomPageAdapter } from '@cellix/serenity-framework/pages/dom';
import { SerenityCast } from '@cellix/serenity-framework/serenity';

// cast: grant every actor the ability
new SerenityCast({ useNotepad: true, abilities: [() => new RenderInDom()] });

// Given: render through the actor
await actor.attemptsTo(Render.component(<LoginForm />, { wrapper: withProviders() }));

// task/question: build the page object from the actor's container
const page = new LoginPage(new DomPageAdapter(RenderInDom.as(actor).container));
```
