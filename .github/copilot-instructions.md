# CellixJS Development Guide

## Architecture Overview

CellixJS is a Domain-Driven Design (DDD) monorepo built on Azure Functions, implementing a modular architecture with strict separation of concerns:

- **Domain Layer**: Core business logic in `@ocom/domain`
- **Application Services**: Orchestration layer in `@ocom/application-services`
- **Infrastructure**: Data persistence via Mongoose, OpenTelemetry observability, etc.. in `@ocom/service-*`
- **API Layer**: GraphQL and REST endpoints via Azure Functions in `@ocom/rest` and `@ocom/graphql`

## Core Patterns

### DDD Structure
Each bounded context follows this structure:
```
domain/contexts/{context-name}/
├── {entity}.ts              # Aggregate roots and entities
├── {entity}.value-objects.ts # Immutable value objects
├── {entity}.uow.ts          # Unit of Work pattern
└── README.md                # Domain structure documentation
```

### Service Registration Pattern
The `Cellix` class orchestrates dependency injection:
```typescript
Cellix.initializeServices<ApiContextSpec>((serviceRegistry) => {
  serviceRegistry.registerService(new ServiceMongoose(...));
})
.setContext((serviceRegistry) => ({ 
  domainDataSource: contextBuilder(serviceRegistry.getService(ServiceMongoose))
}))
```

### Azure Functions Integration
Functions are registered via the main application factory:
```typescript
cellix.registerAzureFunctionHandler('graphql', { route: 'graphql' }, graphHandlerCreator)
```

## Development Workflow

### Essential Commands
```bash
# Initial setup (Node v22 required)
nvm use v22 && npm run clean && npm install && npm run build

# Development startup
npm run dev  # Builds all workspace packages, starts mock emulator services, backend Azure Functions entry point, and frontend React UI

# Build Pipeline Verification
npm run verify    # Run all verification steps (lint, build, test, sonarcloud, quality gate)

# Package-specific operations
npm run build    # Build all packages
npm run lint     # Lint all packages
npm run test     # Test all packages
npm run gen      # Generate code (e.g., GraphQL types)
```

**Important**: Use `npm run verify` to ensure code quality before commits. Address any issues reported before pushing changes.

### VS Code Tasks
Use VS Code tasks for development (preferred over manual commands):
- `func: host start` - Start Azure Functions runtime
- `npm watch (functions)` - Watch mode for API package
- `npm build (functions)` - Build API package

### Testing
- Coverage reports generated in `packages/*/coverage/`
- Run tests: `npm run test`
- Run test with coverage: `npm run test:coverage`
- Run tests in watch mode: `npm run test:watch`

## Code Quality & Standards

### Biome Configuration
- Linting and formatting via Biome (configured in `biome.json`)
- Strict TypeScript configuration (`@cellix/typescript-config/base.json`)
- Tab indentation, strict type checking enabled

### Observability
- OpenTelemetry integration via `@azure/monitor-opentelemetry`
- Automatic instrumentation for MongoDB and Azure Functions
- GraphQL tracing built-in via Apollo Server

## Key Dependencies

### Workspace Structure
Monorepo uses npm workspaces with these core packages:
- `@ocom/api` - Main Azure Functions backend application
- `@ocom/data-sources-mongoose-models` - Mongoose data source models
- `@ocom/domain` - Domain models and business logic
- `@ocom/graphql` - GraphQL implementation
- `@ocom/service-mongoose` - MongoDB data layer
- `@ocom/ui-community` - React frontend application
- `@cellix/*` - Shared seedwork libraries

### External Integrations
- **Azure Functions v4** for serverless hosting
- **MongoDB** via Mongoose for persistence
- **Apollo Server** for GraphQL with Azure Functions adapter
- **Azurite** for local Azure storage emulation

## Architecture Decisions

Key ADRs document critical decisions:
- **0003-domain-driven-design.md**: DDD patterns and bounded contexts
- **0002-open-telemetry.md**: Observability strategy
- **0011-bicep.md**: Infrastructure as Code approach

## File Naming Conventions

- `.entity.ts` for domain entities
- `.value-objects.ts` for value object collections
- `.uow.ts` for Unit of Work implementations
- `azure-functions.ts` for Azure Functions adapters
- Use kebab-case for directories and files
