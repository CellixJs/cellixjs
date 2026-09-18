# Cellix TDD Summary

Package: `@cellix/api-core`

Package path: `packages/cellix/api-core`

Summary path: `packages/cellix/api-core/cellix-tdd-summary.md`

## Package framing

`@cellix/api-core` is a new framework package that owns Azure Functions application bootstrap for Cellix API hosts. It replaces the inlined `Cellix` class that previously lived beside application-specific startup code.

Intended consumers are Azure Functions API applications that register infrastructure services, build an infrastructure context, create a request-scoped application services host, and bind HTTP handlers. This is backend bootstrap only. It is not a general "core" package and is not comparable in purpose to `@cellix/ui-core`.

Non-goals: concrete infrastructure services, GraphQL/REST handlers, domain application services, frontend bootstrap, and generic HTTP-server hosting outside Azure Functions.

## Consumer usage exploration

The primary consumer flow is the fluent bootstrap that API hosts already used:

```ts
import { Cellix } from '@cellix/api-core';

await Cellix.initializeInfrastructureServices<AppContext, AppServices>((registry) => {
	registry.registerInfrastructureService(new MongooseService(url, options));
	registry.registerInfrastructureService(new BlobStorageService(options), 'BlobStorageService');
})
	.setContext((registry) => ({
		mongoose: registry.getInfrastructureService(MongooseService),
		blobs: registry.getInfrastructureService('BlobStorageService'),
	}))
	.initializeApplicationServices((context) => createAppHost(context))
	.registerAzureFunctionHttpHandler('graphql', { route: 'graphql' }, (host) => async (request, fnContext) => {
		const appServices = await host.forRequest(request.headers.get('authorization') ?? undefined);
		return appServices.GraphQL.handle(request, fnContext);
	})
	.startUp();
```

Success paths that shaped the contract:

- constructor-keyed and name-keyed service registration
- context and application-host creation during Azure Functions `appStart`, not during `startUp()`
- per-request HTTP handler factories that receive the host and infrastructure registry
- parallel traced start/stop of unique service instances

Failure and edge cases that shaped the contract:

- duplicate constructor or duplicate name registration
- phase misuse such as `setContext` twice or handler registration before application services
- lookup of missing constructor keys or names
- HTTP requests that arrive before `appStart`
- infrastructure `startUp()` / `shutDown()` failures, including non-Error rejections
- the same instance stored by constructor and by name must start and stop once

Internal: phase enum, pending-handler records, and `InfrastructureServiceStore`.

## Contract gate summary

This is a new package, so human review of the public surface is required. Implementation proceeded because the user asked for the extraction, named the package `@cellix/api-core`, and requested a PR for that review.

Proposed public exports:

- `Cellix`: fluent Azure Functions bootstrap facade
- `InfrastructureServiceRegistry`: register-time service registry used in the initialize callback
- `InitializedServiceRegistry`: lookup-time registry used by context builders and handler factories
- `ContextBuilder`: fluent stage that accepts `setContext`
- `ApplicationServicesInitializer`: fluent stage that accepts `initializeApplicationServices`
- `AzureFunctionHandlerRegistry`: fluent stage that registers HTTP handlers and calls `startUp`
- `StartedApplication`: facade returned by `startUp()`, including context and application-host accessors after `appStart`
- `AppHost`: request-scoped host with `forRequest`
- `ServiceKey`: constructor identity used for constructor-keyed lookup

Primary success-path snippet: the bootstrap chain above.

Uncertain exports: none. `Phase` and `PendingHandler` stay internal. `applicationServices` is included on `StartedApplication` because it is already part of the runtime facade and is useful after `appStart`.

Downstream impact: the in-repo API application now imports `Cellix` from `@cellix/api-core` instead of a local file. Handler names, routes, service registration, and lifecycle timing are unchanged.

## Public contract

Consumers should rely on these observable behaviors:

- `Cellix.initializeInfrastructureServices(callback)` constructs a `Cellix` instance, invokes the callback once, and returns a `ContextBuilder`
- constructor-keyed `registerInfrastructureService(service)` stores the instance under the constructor and rejects a second constructor-keyed registration of the same class
- named `registerInfrastructureService(service, name)` stores a semantic key, allows the same constructor under multiple names, and rejects duplicate names
- `setContext`, `initializeApplicationServices`, `registerAzureFunctionHttpHandler`, and `startUp` are phase-ordered and throw `Invalid operation in phase '...'` when called out of order
- `startUp()` binds `app.http`, `app.hook.appStart`, and `app.hook.appTerminate` without starting services
- `startUp()` may be called from the app-services phase with zero HTTP handlers
- `appStart` starts unique services in parallel, builds context, creates the application host, sets `servicesInitialized`, and logs `Cellix started`
- `appTerminate` stops unique services in parallel and logs `Cellix stopped`
- HTTP `handlerCreator` runs per request and throws `Application not started yet` until `appStart` has created the host
- `getInfrastructureService` resolves constructor keys and names separately and throws `Service not found: ...` when missing
- `context` and `applicationServices` throw until `appStart` completes

These must remain internal:

- `InfrastructureServiceStore`
- phase constants
- pending handler records
- span helper methods

## Test plan

Public-contract tests are written through the package root entrypoint in `packages/cellix/api-core/tests/cellix.test.ts`.

Grouped under `describe('Cellix')` by public member:

- `initializeInfrastructureServices`
- `registerInfrastructureService`
- `setContext`
- `initializeApplicationServices`
- `registerAzureFunctionHttpHandler`
- `startUp`
- `getInfrastructureService`
- `appStart lifecycle`
- `appTerminate lifecycle`
- `HTTP handler execution`

No tests import internals or deep `src/` paths. The previous application-local cucumber suite was removed rather than duplicated, because it imported `./cellix.ts` and poked private fields.

Narrower tests that remain are distinct observable states, not restatements of the happy path: duplicate registration, named-only lookup, `UnknownService` for nameless keys, start without handlers, per-request handler creation, pre-`appStart` HTTP rejection, and Error vs non-Error lifecycle failures.

Intentionally uncovered public-API-unreachable branches: the defensive `contextCreatorInternal` / `appServicesHostBuilder` missing checks inside `appStart`. Those fields are assigned by `setContext` and `initializeApplicationServices`, which `startUp()` already requires.

## Changes made

- Added `packages/cellix/api-core` with `Cellix`, public bootstrap types, an internal service store, contract tests, `manifest.md`, and `README.md`
- Split the former single-file bootstrap into `types.ts`, `infrastructure-service-store.ts`, `cellix.ts`, and `index.ts`
- Kept the fluent method names, error strings, tracer name `cellix:bootstrap`, and Azure Functions hook timing so API startup behavior stays the same
- Pointed the API application at `@cellix/api-core` and deleted `apps/api/src/cellix.ts`, `cellix.test.ts`, and `features/cellix.feature`
- Added the package to Sonar source/test roots

## Documentation updates

- Created maintainer `manifest.md` with purpose, scope, non-goals, public API shape, and testing/release expectations
- Created consumer `README.md` with standalone install, usage, service-registration rules, and the `startUp()` vs `appStart` distinction
- Added TSDoc on `Cellix` (class, static factory, and index re-export) and on every public type, including `@example` / `@returns` on the class export

## Release hardening notes

Export surface review: one runtime export (`Cellix`) plus the eight types that appear on public method signatures. No `internal`, helper, or file-structure subpaths.

Compatibility / semver: this is a new `1.0.0` private workspace package. For the in-repo API application the change is a compatible move of existing bootstrap behavior. The fluent method names and lifecycle timing are preserved, so this is not a breaking runtime change for that consumer. Publishing to npm is a separate later step and would start a new public contract.

Remaining risk / follow-up before treating the package as publish-ready:

- human review of the public type list on this PR
- no npm publish configuration or changelog has been added
- Azure Functions remains a hard host dependency; this package is not a generic HTTP bootstrap

## Validation performed

Ran and passed:

- `pnpm --filter @cellix/api-core build` — passed
- `pnpm --filter @cellix/api-core test` — passed (62 tests, including typecheck)
- `pnpm --filter @cellix/api-core test:coverage` — passed; 98.33% statements/lines, 92.85% branches, 100% functions. Remaining uncovered lines are the two defensive `appStart` invariant checks
- `pnpm --filter @apps/api build` — passed
- `pnpm --filter @apps/api test` — passed
- `pnpm --filter @cellix/archunit-tests test` — passed
- `pnpm --filter @cellix/api-core lint` and `pnpm --filter @apps/api lint` — passed
- `pnpm run knip` — passed after recording `@azure/functions` as an apps/api host dependency (no remaining direct import once bootstrap moved)
- `node --experimental-strip-types .agents/skills/cellix-tdd/evaluator/check-cellix-tdd.ts --package packages/cellix/api-core --output packages/cellix/api-core/cellix-tdd-summary.md` — passed 20/20

A passing evaluator score confirms the observable artifacts meet the rubric heuristics. It does not mean the package is approved to publish; human review of the public contract is still required.

Wider pre-commit verification (`pnpm run verify`: format, arch, coverage merge, e2e, knip, audit, snyk) is run at commit time.
