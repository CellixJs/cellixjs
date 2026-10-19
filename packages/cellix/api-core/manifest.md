# @cellix/api-core Manifest

## Purpose

`@cellix/api-core` is the Azure Functions bootstrap for Cellix API applications. It owns the phased startup facade that registers infrastructure services, builds an infrastructure context, creates a request-scoped application services host, binds HTTP handlers, and wires Azure Functions `appStart` / `appTerminate` lifecycle hooks.

## Scope

- Fluent application bootstrap beginning at `Cellix.initializeInfrastructureServices`
- Constructor-keyed and name-keyed infrastructure service registration
- Deferred infrastructure context and application-host creation during Azure Functions `appStart`
- Azure Functions HTTP handler registration with per-request handler factories
- Parallel traced start and stop of unique infrastructure services
- The public types that appear on the bootstrap chain

## Non-goals

- Application-specific infrastructure context shapes
- Concrete infrastructure services such as MongoDB, blob storage, or token validation
- GraphQL, REST, or domain application-service implementations
- Frontend or UI bootstrap
- Replacing the Azure Functions programming model with a generic HTTP server abstraction
- Owning OpenTelemetry exporter configuration; this package only creates bootstrap spans

## Public API shape

- The supported public API is the package root import: `@cellix/api-core`
- Runtime export: `Cellix`
- Public types: `InfrastructureServiceRegistry`, `InitializedServiceRegistry`, `ContextBuilder`, `ApplicationServicesInitializer`, `AzureFunctionHandlerRegistry`, `StartedApplication`, `AppHost`, `ServiceKey`
- Azure Functions and OpenTelemetry clients are dependencies, not re-exported
- Internal service maps, phase enums, and lifecycle helpers stay unexported

## Core concepts

- Bootstrap is a phase machine: `infrastructure` → `context` → `app-services` → `handlers` → `started`
- `startUp()` registers handlers and hooks with Azure Functions; it does not start services
- Services start, context is built, and the application host is created in `appStart`
- Constructor registration is unique per class; named registration allows multiple instances of the same class
- Lifecycle start/stop de-duplicates the same service instance when it is stored under both a constructor key and a name
- HTTP `handlerCreator` functions run per request, after `appStart` has produced the application host

## Package boundaries

- Keep Azure Functions host wiring and service-registry mechanics inside this package
- Do not export file-structure helpers, phase constants, or the internal service store
- Application packages own which services to register, how context is built, and how request handlers use `AppHost.forRequest`
- `@cellix/api-services-spec` remains the lifecycle contract for individual infrastructure services

## Dependencies / relationships

- Depends on `@cellix/api-services-spec` for `ServiceBase`
- Depends on `@azure/functions` for `app.http` and application lifecycle hooks
- Depends on `@opentelemetry/api` for bootstrap tracing
- Intended consumers are Azure Functions API applications that currently inlined this bootstrap

## Testing strategy

- Verify observable bootstrap behavior through the `@cellix/api-core` root entrypoint only
- Keep public-contract coverage in `tests/cellix.test.ts`, grouped under the `Cellix` export
- Mock `@azure/functions` and `@opentelemetry/api`; do not require a Functions host or live telemetry backend
- Cover success paths plus phase errors, duplicate registration, named lookup, startup/shutdown failure, and handler execution before and after `appStart`

## Documentation obligations

- Keep `README.md` consumer-facing and focused on installing and using the bootstrap chain
- Keep TSDoc on `Cellix` and every public type aligned with the fluent contract, including `startUp()` vs `appStart` timing
- Update this manifest when the public surface or package boundary changes

## Release-readiness standards

- Public exports stay limited to the bootstrap facade and its signature types
- Package build and package tests must pass
- Downstream API applications must keep the same Azure Functions handler names, routes, and service lifecycle behavior after adopting this package
- Human review of the public contract is required before treating the package as publishable
