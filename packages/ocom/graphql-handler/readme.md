# @ocom/graphql-handler

Azure Functions HTTP integration for GraphQL in the Cellix framework.

## Purpose

This package provides the Azure Functions HTTP bindings and handler logic for serving GraphQL requests. It integrates with `@ocom/service-apollo-server` to create HTTP handlers that can be registered with the Cellix framework.

## Usage

### Creating a Handler

```typescript
import { graphHandlerCreator } from '@ocom/graphql-handler';
import { ServiceApolloServer } from '@ocom/service-apollo-server';
import type { ApplicationServicesFactory } from '@ocom/application-services';

// In your Cellix application setup
const createHandler = (appServicesFactory: ApplicationServicesFactory) => {
  // Get the Apollo Server service from context
  const apolloService = context.getInfrastructureService(ServiceApolloServer);
  
  // Create the handler
  return graphHandlerCreator(apolloService, appServicesFactory);
};
```

### Registering with Cellix

```typescript
Cellix
  .initializeInfrastructureServices(...)
  .setContext(...)
  .initializeApplicationServices(...)
  .registerAzureFunctionHttpHandler(
    'graphql',
    { route: 'graphql/{*segments}', methods: ['GET', 'POST'] },
    (appServicesFactory) => {
      const apolloService = /* get from context */;
      return graphHandlerCreator(apolloService, appServicesFactory);
    }
  )
  .startUp();
```

## Components

### graphHandlerCreator

Creates an Azure Functions HTTP handler that:
- Extracts authentication headers and principal hints from requests
- Creates request-scoped application services
- Delegates GraphQL execution to the Apollo Server service
- Handles request/response transformation for Azure Functions

### GraphContext

Defines the GraphQL context type used by resolvers:

```typescript
interface GraphContext extends BaseContext {
  applicationServices: ApplicationServices;
}
```

### AzureFunctionsMiddlewareOptions

Configuration options for the Azure Functions integration, including context creation.

## Integration with Apollo Server Service

This package expects the Apollo Server to already be started by `@ocom/service-apollo-server`. It does NOT start the server itself - it only creates the HTTP handler that uses the running server instance.
