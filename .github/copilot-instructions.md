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
nvm use v22 && pnpm run clean && pnpm install && pnpm run build

# Development startup
pnpm run dev  # Builds all workspace packages, starts mock emulator services, backend Azure Functions entry point, and frontend React UI

# Build Pipeline Verification
pnpm run verify    # Run all verification steps (lint, build, test, sonarcloud, quality gate)

# Package-specific operations
pnpm run build    # Build all packages
pnpm run lint     # Lint all packages
pnpm run test     # Test all packages
pnpm run gen      # Generate code (e.g., GraphQL types)
```

**Important**: 
- Use `pnpm run verify` to ensure code quality before commits
- Use `pnpm run snyk` to run security scans before commits
- Address any issues reported before pushing changes

### Security Scanning Workflow

**During code generation**:
- Use `snyk_code_scan` MCP tool for immediate security feedback on newly generated code
- Fix security issues iteratively as code is generated

**Before committing changes**:
```bash
pnpm run snyk  # Run all security scans
```

This runs three security scans:
- `snyk:code` - SAST (Static Application Security Testing) for source code vulnerabilities
- `snyk:test` - SCA (Software Composition Analysis) for dependency vulnerabilities
- `snyk:iac` - IaC scanning for Bicep template security misconfigurations

**If security issues are found**:
1. Review Snyk output for vulnerability details and remediation guidance
2. Fix the reported issues (upgrade dependencies, refactor code, etc.)
3. Re-run `pnpm run snyk` to verify fixes
4. Repeat until all scans pass
5. Only then commit the changes

**Note**: Do NOT use `snyk:report` or any Snyk subtasks tagged with `:report` - these are reserved for CI/CD pipeline only.

### VS Code Tasks
Use VS Code tasks for development (preferred over manual commands):
- `func: host start` - Start Azure Functions runtime
- `npm watch (functions)` - Watch mode for API package
- `npm build (functions)` - Build API package

### Testing
- Coverage reports generated in `packages/*/coverage/`
- Run tests: `pnpm run test`
- Run test with coverage: `pnpm run test:coverage`
- Run tests in watch mode: `pnpm run test:watch`

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
Monorepo uses pnpm workspaces with these core packages:
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
