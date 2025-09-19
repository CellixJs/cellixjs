---
applyTo: "packages/api-graphql/**/*.ts"
---
# Copilot Instructions: @ocom/api-graphql

## Purpose
- This package provides GraphQL API endpoints for the CellixJS DDD application.
- Implements Apollo Server v4 integrated with Azure Functions for serverless GraphQL hosting.
- Serves as the API gateway exposing domain functionality through GraphQL schemas and resolvers.
- Bridges the GraphQL layer with domain services through the Cellix service registry.

## Architecture & Patterns
- **Apollo Server v4**: Modern GraphQL server with full Apollo ecosystem integration.
- **Azure Functions Integration**: Custom adapter for Azure Functions v4 runtime.
- **Domain-Driven Design**: GraphQL resolvers interact with domain aggregates via unit of work patterns.
- **Context Injection**: Domain data sources and services injected through GraphQL context.
- **Type Safety**: Full TypeScript integration with strong typing for schemas, resolvers, and context.

## Core Components
- **Schema Definition**: GraphQL type definitions using SDL (Schema Definition Language).
- **Resolvers**: Functions that fetch data for GraphQL fields, connected to domain services.
- **Context**: Request-scoped data including domain data sources, authentication, and services.
- **Azure Functions Adapter**: Custom middleware bridging Apollo Server and Azure Functions.

## Coding Conventions
- Use TypeScript interfaces for GraphQL context types extending `BaseContext`.
- Define schemas using tagged template literals with `#graphql` comment for syntax highlighting.
- Resolvers should follow GraphQL resolver signature: `(parent, args, context, info)`.
- Access domain services through the injected `apiContext` in GraphQL context.
- Use proper error handling and return GraphQL-compatible error objects.
- Follow Apollo Server v4 patterns and best practices.

## File/Folder Structure
```
src/
├── index.ts                     # Main GraphQL handler factory
├── azure-functions.ts           # Azure Functions adapter for Apollo Server
├── context.ts                   # GraphQL context types and builders
├── schema/                      # GraphQL schema definitions (future)
│   ├── types/                   # Type definitions
│   └── resolvers/               # Resolver implementations
└── middleware/                  # GraphQL middleware (auth, validation, etc.)
```

## Integration with CellixJS
- Registered with Cellix service container via `graphHandlerCreator`.
- Receives `ApiContextSpec` containing domain data sources.
- Access domain aggregates through unit of work patterns.
- Follows established error handling and logging patterns.

## GraphQL Context Structure
```typescript
interface GraphContext extends BaseContext {
  apiContext: ApiContextSpec;     // Domain data sources and services
  // Add authentication, user context, etc.
}
```

## Azure Functions Integration
- Uses custom adapter in `azure-functions.ts` for Apollo Server v4 compatibility.
- Handles HTTP request/response transformation between Azure Functions and Apollo.
- Supports both GET and POST requests with proper content-type handling.
- Includes error handling and proper HTTP status codes.

## Testing
- Unit tests required for all resolvers using mocked domain services.
- Integration tests should test full GraphQL queries against real schema.
- Use Apollo Server testing utilities for schema validation.
- Test Azure Functions integration with proper request/response mocking.

## Performance Considerations
- Implement proper GraphQL query complexity analysis and limiting.
- Use DataLoader pattern for efficient database queries and N+1 prevention.
- Consider query depth limiting and timeout handling.
- Leverage Apollo Server caching mechanisms appropriately.

## Security
- Implement authentication middleware in GraphQL context.
- Use domain-level authorization through passport/visa patterns.
- Validate and sanitize all input arguments.
- Implement rate limiting and query complexity analysis.

## Examples
- To add a new query: Define in schema, implement resolver, connect to domain service.
- To access domain data: Use `context.apiContext.domainDataSource.{Context}.{Aggregate}.{UnitOfWork}`.
- To handle errors: Throw GraphQL-compatible errors or use Apollo Server error extensions.