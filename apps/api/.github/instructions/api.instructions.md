---
applyTo: "packages/api/**/*.ts"
---

# @ocom/api Package Instructions

## Purpose
The `@ocom/api` package is the main Azure Functions application entry point that orchestrates the entire CellixJS serverless API. It acts as the composition root, configuring dependency injection, service initialization, and Azure Functions handler registration.

## Core Architecture

### Cellix Framework
- **Central Class**: `Cellix<ContextType>` - The main orchestration class implementing service registry and Azure Functions integration
- **Service Registry Pattern**: All services must be registered via `registerService()` before context creation
- **Context Creation**: Use `setContext()` to build the application context after service registration
- **Handler Registration**: Use `registerAzureFunctionHandler()` to register Azure Functions endpoints

### Initialization Flow
```typescript
Cellix.initializeServices<ApiContextSpec>((serviceRegistry) => {
  // Register all services here
  serviceRegistry.registerService(new ServiceExample(...));
})
.setContext((serviceRegistry) => ({
  // Build context from registered services
  domainDataSource: contextBuilder(serviceRegistry.getService(ServiceExample))
}))
.then((cellix) => {
  // Register Azure Functions handlers
  cellix.registerAzureFunctionHandler('name', { route: 'path' }, handlerCreator);
});
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
- Handler creators must accept context and return `HttpHandler`
- Use descriptive names for function registration
- Configure routes in handler registration, not in individual handlers

### Error Handling
- Let Cellix handle service startup/shutdown errors with OpenTelemetry tracing
- Use proper error boundaries in individual handlers
- Log errors with context using the built-in tracer

## Key Dependencies
- `@azure/functions` - Azure Functions v4 runtime
- `@azure/identity` - Azure authentication
- OpenTelemetry integration via `@ocom/service-otel`
- Service interfaces from `@cellix/api-services-spec`

## Development Notes
- OpenTelemetry starts automatically on module load
- Services have async `startUp()` and `shutDown()` lifecycle methods
- Context is immutable once set
- All services must extend `ServiceBase` interface