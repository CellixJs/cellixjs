# @ocom/service-apollo-server

Apollo Server infrastructure service for the Cellix framework.

## Purpose

This package provides an Apollo Server implementation that follows the Cellix `ServiceBase` pattern. It manages the Apollo Server lifecycle with `startUp()` and `shutDown()` hooks, integrating seamlessly with the Cellix application bootstrap process.

## Usage

### Registration

Register the service during Cellix infrastructure initialization:

```typescript
import { Cellix } from './cellix.ts';
import { ServiceApolloServer } from '@ocom/service-apollo-server';
import { combinedSchema } from '@ocom/graphql';
import { permissions } from '@ocom/graphql';

Cellix.initializeInfrastructureServices((serviceRegistry) => {
  serviceRegistry.registerInfrastructureService(
    new ServiceApolloServer({
      schema: combinedSchema,
      middleware: permissions,
      introspection: true,
      allowBatchedHttpRequests: true,
      maxDepth: 10,
    })
  );
  // ... register other services
})
```

### Configuration

The service is configured via `ServiceApolloServerOptions`:

```typescript
interface ServiceApolloServerOptions<TContext extends BaseContext = BaseContext> {
  schema: GraphQLSchema;          // Required: The GraphQL schema
  middleware?: unknown;            // Optional: Middleware (e.g., permissions)
  introspection?: boolean;         // Optional: Enable introspection (default: true in dev)
  allowBatchedHttpRequests?: boolean; // Optional: Allow batched requests (default: true)
  maxDepth?: number;              // Optional: Max query depth (default: 10)
}
```

### Accessing the Server

Retrieve the service from the context to access the Apollo Server instance:

```typescript
const apolloService = serviceRegistry.getInfrastructureService(ServiceApolloServer);
const server = apolloService.server;
```

## Service Configuration

Configuration should be placed in `apps/api/src/service-config/apollo-server/` following the Cellix convention. See the `@ocom/api` package for integration examples.

## Lifecycle

- **startUp()**: Initializes and starts the Apollo Server
- **shutDown()**: Stops the Apollo Server gracefully

The Cellix framework automatically calls these methods during application startup and termination.
