---
applyTo: "apps/api/**/*.ts"
---

# @ocom/api Package Instructions

## Purpose
The `@ocom/api` package is the main Azure Functions application entry point that orchestrates the entire CellixJS serverless API. It acts as the composition root, configuring dependency injection, service initialization, and Azure Functions handler registration.

## Core Architecture

### Cellix Framework
- **Central Class**: `Cellix<ContextType>` - The main orchestration class implementing service registry and Azure Functions integration
- **Service Registry Pattern**: All services must be registered via `registerInfrastructureService()` before context creation
- **Context Creation**: Use `setContext()` to build the application context after service registration
- **HTTP Handler Registration**: Use `registerAzureFunctionHttpHandler()` to register Azure Functions HTTP endpoints
- **Queue Handler Registration**: Use `registerAzureFunctionQueueHandler()` to register Azure Functions Storage Queue trigger endpoints

### Initialization Flow
```typescript
Cellix.initializeInfrastructureServices<ApiContextSpec, ApplicationServices>((serviceRegistry) => {
  // Register all infrastructure services here
  serviceRegistry.registerInfrastructureService(new ServiceExample(...));
})
.setContext((serviceRegistry) => ({
  // Build context from registered services
  domainDataSource: contextBuilder(serviceRegistry.getInfrastructureService(ServiceExample))
}))
.initializeApplicationServices((context) => buildApplicationServicesFactory(context))
// Register Azure Functions HTTP handlers
.registerAzureFunctionHttpHandler('name', { route: 'path' }, handlerCreator)
// Register Azure Functions Storage Queue trigger handlers
.registerAzureFunctionQueueHandler('queue-name', { queueName: 'queue-name', connection: 'AzureWebJobsStorage' }, queueHandlerCreator)
.startUp();
```

## File Structure

### Core Files
- `src/index.ts` - Main entry point with service registration and handler setup
- `src/cellix.ts` - Core framework class (avoid modifying unless extending framework)
- `src/service-config/` - Service configuration modules

### Service Configuration
- `service-config/otel-starter.ts` - OpenTelemetry initialization (runs at module load)
- `service-config/mongoose/` - MongoDB/Mongoose configuration
- Use environment variables for all configuration values

## Coding Conventions

### Service Registration
- Register services in order of dependency (independents first)
- Use constructor injection for service dependencies
- Export configuration builders for reusability

### Environment Variables
- Access via `process.env['VAR_NAME']` (bracket notation required for Biome)
- Provide fallback values or throw errors for required variables
- Use different configs for development vs production

### Azure Functions Integration
- HTTP handler creators must accept `(appServicesHost, infrastructureRegistry)` and return `HttpHandler`
- Queue handler creators must accept `(appServicesHost, infrastructureRegistry)` and return `StorageQueueHandler<T>`
- Use descriptive names for function registration
- Configure routes/queue names in handler registration, not in individual handlers

#### HTTP Handler Example
```typescript
cellix.registerAzureFunctionHttpHandler(
  'graphql',
  { route: 'graphql/{*segments}', methods: ['GET', 'POST'] },
  (host, infra) => async (req, ctx) => {
    const app = await host.forRequest(req.headers.get('authorization') ?? undefined);
    return app.GraphQL.handle(req, ctx);
  }
);
```

#### Queue Handler Example
```typescript
cellix.registerAzureFunctionQueueHandler<MyQueuePayload>(
  'my-queue',
  { queueName: 'my-queue', connection: 'AzureWebJobsStorage' },
  (host, infra) => async (queueEntry, context) => {
    const queueService = infra.getInfrastructureService(ServiceQueueStorage);
    // Map Azure Functions trigger metadata to QueueTriggerMetadata
    const metadata = {
      id: (context.triggerMetadata?.['id'] as string) ?? '',
      popReceipt: context.triggerMetadata?.['popReceipt'] as string | undefined,
      dequeueCount: context.triggerMetadata?.['dequeueCount'] as number | undefined,
    };
    // Validate and decode via the registered queue service
    const message = await queueService.receiveFromMyQueue(queueEntry, metadata);
    const appServices = await host.forRequest();
    // Process message.payload ...
  }
);
```

### Error Handling
- Let Cellix handle service startup/shutdown errors with OpenTelemetry tracing
- Use proper error boundaries in individual handlers
- For queue handlers: catch expected errors (e.g., entity not found) and log them — do **not** rethrow, as requeuing would cause poison-message loops
- Log errors with context using `context.error(...)` provided by the Azure Functions runtime

## Key Dependencies
- `@azure/functions` - Azure Functions v4 runtime
- `@azure/identity` - Azure authentication
- OpenTelemetry integration via `@ocom/service-otel`
- Service interfaces from `@cellix/api-services-spec`
- Queue definitions and service from `@ocom/service-queue-storage`

## Development Notes
- OpenTelemetry starts automatically on module load
- Services have async `startUp()` and `shutDown()` lifecycle methods
- Context is immutable once set
- All services must extend `ServiceBase` interface
- Queue handlers are registered via `app.storageQueue()` from `@azure/functions` under the hood
- The `connection` field in queue handler options must reference an app setting name (environment variable), not the connection string value itself
- For local development, `AzureWebJobsStorage` maps to the Azurite connection string via `local.settings.json`