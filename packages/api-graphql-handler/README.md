# @ocom/api-graphql-handler

Azure Functions HTTP handler for GraphQL endpoints.

## Purpose

This package provides the Azure Functions specific integration for GraphQL endpoints. It handles HTTP request/response mapping and integrates with the Cellix infrastructure service framework.

## Architecture

- **Separation of Concerns**: This package handles only Azure Functions HTTP concerns, while `@ocom/api-graphql` handles pure GraphQL schema and resolvers.
- **Service Integration**: Integrates with `@ocom/service-apollo-server` for Apollo Server instances managed as infrastructure services.
- **Request Context**: Builds GraphQL context from HTTP headers and application services.

## Dependencies

- `@ocom/api-graphql`: GraphQL schema and context definitions
- `@ocom/service-apollo-server`: Apollo Server infrastructure service
- `@ocom/api-application-services`: Application services factory
- `@azure/functions-v4`: Azure Functions runtime

## Usage

```typescript
import { graphHandlerCreator } from '@ocom/api-graphql-handler';
import type { ApplicationServicesFactory } from '@ocom/api-application-services';

// Register with Cellix framework
cellix.registerAzureFunctionHttpHandler(
  'graphql',
  { route: 'graphql/{*segments}', methods: ['GET', 'POST', ...] },
  (applicationServicesHost) => graphHandlerCreator(applicationServicesHost as ApplicationServicesFactory),
);
```

## Exports

- `graphHandlerCreator`: Main handler factory function
- `startServerAndCreateHandler`: Low-level Azure Functions adapter
- `AzureFunctionsMiddlewareOptions`: TypeScript interface for configuration
- `WithRequired`: Utility type for required properties