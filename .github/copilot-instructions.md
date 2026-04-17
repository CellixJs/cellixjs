# CellixJS Development Guide

## AI Orchestration Workflow

CellixJS uses a profile-driven orchestration workflow defined by:

- `orchestration.spec.yaml`
- `.agents/orchestration/model/orchestration-model.v1.json`
- `.github/instructions/orchestration-*.instructions.md`
- `.github/agents/*.agent.md`
- `AGENTS.md`

When working with AI agents:

- in Copilot CLI, explicitly select the `senior-orchestrator` agent before giving a substantive development prompt when you want the repo orchestration workflow
- classify work into one primary lane before substantial implementation
- bootstrap the task from changed paths with `pnpm run orchestration:bootstrap -- --session <session-id> <changed-path>...`
- choose `<changed-path>` from the concrete task scope first; do not default to the full branch diff when the branch already contains unrelated orchestration or documentation work
- if bootstrap reports `Requires lane decision: yes`, stop and choose the lane explicitly instead of continuing with an assumed lane
- follow the explicit workflow states `initialized -> planning -> plan-complete -> implementing -> reviewing -> revising/done`
- use `blocked` only for real blockers or unresolved ambiguity
- keep runtime artifact depth minimal by default
- activate `cellix-tdd` only for reusable framework work in profiles that support framework behavior
- if changed paths span application and reusable framework classes, split the task into bounded phases instead of delegating one blended implementation pass
- bootstrap normally advances the session into `planning`; do not call `transition planning` again unless bootstrap was intentionally run with `--no-planning`
- use `pnpm run orchestration:session-status -- --session <session-id>` to inspect bounded changed paths, canonical checkpoint targets, and the recommended next step
- require discovery planning to write `.agents-work/orchestration/sessions/<session-id>/plan.md`, then use `pnpm run orchestration:hook -- handoff implementing --session <session-id> --role senior-orchestrator`
- delegate discovery planning in a blocking/foreground way unless the environment has a reliable result-retrieval path for background agents
- keep implementation prompts concise and plan-driven: pass the session id, changed-path scope, and canonical artifact paths from `orchestration:session-status`, then have the implementation agent read `plan.md` instead of restating the full plan inline
- during `implementing`, prefer targeted validation for the changed scope; reserve `pnpm run verify` for explicit user requests or a later review/final gate
- senior-orchestrator should own post-delegate transitions by default: verify `.agents-work/orchestration/sessions/<session-id>/implementation/result.md`, then use `pnpm run orchestration:hook -- handoff reviewing --session <session-id> --role senior-orchestrator`
- require the reviewer to write `.agents-work/orchestration/sessions/<session-id>/review/decision.md`, then resolve the outcome with `pnpm run orchestration:hook -- complete done|revising --session <session-id> --role senior-orchestrator`
- if a bounded implementation failure occurs inside the changed scope, run at most one focused repair pass automatically; if it still fails, stop and summarize instead of looping

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
- *Note*: Be patient when you run the `verify` command; wait at least 6 minutes for all checks to complete before assuming unexpected failure.
- Use `pnpm run snyk` to run security scans before commits
cop- If you encounter this error when attempting to push changes `hook git error: Command failed with exit code 1: git commit -m REDACTED`, it indicates that pre-commit hooks have failed due to unmet code quality or security standards. Review the output from the hooks, fix the reported issues, and try committing again. Be aware that this error has nothing to do with firewall rules or network connectivity; it is expected to fail if your changes do not meet the project's standards.
- Address any reported issues across all packages before pushing changes (if something fails, it was due to your changes and is considered to be "your code").

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
- `@apps/api` - Main Azure Functions backend application
- `@ocom/data-sources-mongoose-models` - Mongoose data source models
- `@ocom/domain` - Domain models and business logic
- `@ocom/graphql` - GraphQL implementation
- `@ocom/service-mongoose` - MongoDB data layer
- `@apps/ui-community` - React frontend application
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
