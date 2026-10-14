# `@cellix/api-core`

Azure Functions application bootstrap for Cellix API applications.

Use this package when an API host needs a framework-owned way to register infrastructure services, build an infrastructure context, create a request-scoped application services host, and bind Azure Functions HTTP handlers.

## Install

```sh
npm install @cellix/api-core
```

The package depends on `@azure/functions`, `@opentelemetry/api`, and `@cellix/api-services-spec`. Infrastructure services you register must implement `ServiceBase` from `@cellix/api-services-spec`.

## Overview

`Cellix` is a fluent bootstrap facade. Construction always starts at `Cellix.initializeInfrastructureServices`. The chain then:

1. Registers infrastructure services
2. Describes how those services become an infrastructure context
3. Supplies a request-scoped application services host
4. Binds Azure Functions HTTP handlers
5. Hands control to the Azure Functions runtime

`startUp()` registers handlers and lifecycle hooks. It does **not** start services. Service `startUp()`, context creation, and host creation run later in the Azure Functions `appStart` hook. `appTerminate` stops the same unique service instances.

## Usage

```ts
import { Cellix } from '@cellix/api-core';

await Cellix.initializeInfrastructureServices<AppContext, AppServices>((registry) => {
	registry.registerInfrastructureService(new MongooseService(url, options));
	registry.registerInfrastructureService(new BlobStorageService(blobOptions), 'BlobStorageService');
})
	.setContext((registry) => ({
		mongoose: registry.getInfrastructureService(MongooseService),
		blobs: registry.getInfrastructureService('BlobStorageService'),
	}))
	.initializeApplicationServices((context) => createAppHost(context))
	.registerAzureFunctionHttpHandler('graphql', { route: 'graphql/{*segments}', methods: ['GET', 'POST'] }, (host) => {
		return async (request, functionContext) => {
			const appServices = await host.forRequest(request.headers.get('authorization') ?? undefined);
			return appServices.GraphQL.handle(request, functionContext);
		};
	})
	.startUp();
```

### Reading IP-related request headers

HTTP handlers can use the shared helper to read common IP-related headers consistently:

```ts
import { getRequestIpHeaders } from '@cellix/api-core';

const ipHeaders = getRequestIpHeaders(request);
```

The helper returns raw `X-Forwarded-For`, `X-Azure-ClientIP`, `X-Azure-SocketIP`, and `X-Real-IP` values. It does not parse or select an address. Forwarded headers are only trustworthy when the application is configured to trust the proxy or ingress that supplies them.

### Service registration

- Omit `name` to key a service by constructor. A second constructor-keyed registration of the same class throws.
- Pass `name` to store a semantic key. The same constructor may be registered under multiple names.
- `getInfrastructureService(ServiceClass)` and `getInfrastructureService('name')` are separate lookups.
- If the same instance is stored by constructor and by name, `appStart` and `appTerminate` call `startUp()` / `shutDown()` once.

### HTTP handlers

The `handlerCreator` runs **per request**. It receives the application services host and the initialized infrastructure registry. Requests that arrive before `appStart` has created the host fail with `Application not started yet`.

Handlers are optional. Calling `startUp()` immediately after `initializeApplicationServices` still binds `appStart` and `appTerminate`.

## Public exports

Import from the package root only:

- `Cellix`
- `type InfrastructureServiceRegistry`
- `type InitializedServiceRegistry`
- `type ContextBuilder`
- `type ApplicationServicesInitializer`
- `type AzureFunctionHandlerRegistry`
- `type StartedApplication`
- `type AppHost`
- `type ServiceKey`
- `getRequestIpHeaders(request)`
- `type RequestIpHeaders`

## Notes

- Phase methods are ordered. Calling `setContext` twice, or registering a handler before application services are initialized, throws an invalid-phase error.
- `StartedApplication.context`, `applicationServices`, and `servicesInitialized` reflect `appStart` completion, not the resolution of `startUp()`.
- Bootstrap tracing uses the tracer name `cellix:bootstrap` and spans `cellix.appStart` / `cellix.appTerminate`.
