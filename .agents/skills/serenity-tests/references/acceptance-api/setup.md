# Acceptance API Setup

Use this guide when creating or changing the API-only Cucumber Screenplay suite. The PR #267 model is `packages/ocom-verification/acceptance-api`.

## Package Shape

- Keep the package private, ESM, and TypeScript-loaded by Cucumber through `tsx/esm`.
- Depend on `@cellix/serenity-framework`, `@cucumber/cucumber`, `@serenity-js/core`, `@serenity-js/cucumber`, `@serenity-js/assertions`, `@serenity-js/console-reporter`, and `@serenity-js/serenity-bdd`.
- Put app-specific dependencies, GraphQL schema/server packages, persistence packages, and seed helpers in the consumer package rather than the framework.
- Use scripts shaped like:

```json
{
  "test:acceptance": "LOG_LEVEL=warn NODE_OPTIONS='--import tsx/esm' cucumber-js --format json:./reports/cucumber-report-api.json",
  "test:coverage:acceptance": "LOG_LEVEL=warn NODE_OPTIONS='--import tsx/esm' c8 -- cucumber-js --format json:./reports/cucumber-report-api.json"
}
```

## Cucumber Config

- Point `paths` at shared feature files, usually `../verification-shared/src/scenarios/**/*.feature`.
- Import `src/world.ts` and a single step-definition barrel such as `src/step-definitions/index.ts`.
- Use the framework formatter for agents:

```ts
import { isAgent } from 'std-env';

export default {
  paths: ['../verification-shared/src/scenarios/**/*.feature'],
  import: ['src/world.ts', 'src/step-definitions/index.ts'],
  format: [
    ...(isAgent ? ['@cellix/serenity-framework/formatters/agent'] : ['progress-bar']),
    'json:./reports/cucumber-report-api.json',
    'html:./reports/cucumber-report-api.html',
  ],
  formatOptions: { snippetInterface: 'async-await' },
  parallel: 1,
};
```

## Infrastructure

- Use `ApiInfrastructure` for API-only suites. It starts process or in-memory servers, resets scenario state, and stops servers without launching a browser.
- Register servers in dependency order with explicit `dependsOn` metadata.
- Keep server constructors app-owned. The framework should receive ready `TestServer` instances, not import OCOM paths.

```ts
import { ApiInfrastructure } from '@cellix/serenity-framework/infrastructure/api';
import { apiGraphQLTestServer, mongooseTestServer, testMongoServer } from './servers/index.ts';

export const infrastructure = ApiInfrastructure.create()
  .addServer('mongo', testMongoServer)
  .addServer('mongoose', mongooseTestServer, { dependsOn: ['mongo'] })
  .addServer('graphql', apiGraphQLTestServer, { dependsOn: ['mongoose'] })
  .finalize();
```

## World And Hooks

- Use `registerManagedSerenityWorld`.
- Validate that the GraphQL server URL exists before creating the cast.
- Give actors app-specific abilities, commonly a GraphQL client ability and domain command abilities.
- Register lifecycle hooks from `world.ts` after exporting the world type.

```ts
export const CellixApiWorld = registerManagedSerenityWorld({
  infrastructure,
  validateState: (state) => {
    const graphql = state.servers['graphql'];
    if (!graphql?.isRunning()) throw new Error('API acceptance infrastructure did not expose a graphqlUrl');
  },
  createCast: (state) =>
    new SerenityCast({
      useNotepad: true,
      abilities: [
        () => createGraphQLClientAbility(state.servers['graphql']?.getUrl() ?? ''),
        () => createCommunityAbility(),
      ],
    }),
});
```

Lifecycle hooks should call `world.init()` before each scenario, `world.cleanup()` after each scenario, and `infrastructure.stopAll()` in `AfterAll`.

## Turborepo

- Add `test:acceptance`, `test:coverage:acceptance`, and `test:serenity` tasks when the package participates in repo-level verification.
- Depend on `^build`.
- Include `src/**/*.ts`, `cucumber.js`, `package.json`, and coverage config in task inputs.
- Keep process-backed acceptance tasks uncached unless the suite is proven deterministic and side-effect free.
