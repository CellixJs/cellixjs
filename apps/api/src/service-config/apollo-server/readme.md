# Apollo Server Service Configuration

This directory contains the configuration for the Apollo Server service used by the API.

## Configuration Options

The `apolloServerOptions` export provides the configuration for the `ServiceApolloServer` infrastructure service:

- **schema**: The combined GraphQL schema from `@ocom/graphql`
- **middleware**: Permissions middleware for authorization
- **introspection**: GraphQL introspection (enabled in development, disabled in production)
- **allowBatchedHttpRequests**: Allow batching multiple GraphQL operations in one HTTP request
- **maxDepth**: Maximum allowed depth for GraphQL queries (default: 10)

## Usage

This configuration is imported and used during Cellix infrastructure service registration:

```typescript
import { ServiceApolloServer } from '@ocom/service-apollo-server';
import * as ApolloServerConfig from './service-config/apollo-server/index.ts';

Cellix.initializeInfrastructureServices((serviceRegistry) => {
  serviceRegistry.registerInfrastructureService(
    new ServiceApolloServer(ApolloServerConfig.apolloServerOptions)
  );
});
```

## Environment Variables

- `NODE_ENV`: Controls introspection (enabled when not 'production')
