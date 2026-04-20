# CellixJS Development Guide

## AI Orchestration Workflow

CellixJS now uses a simpler hook-driven agent workflow for Copilot CLI.

The primary workflow files are:

- `.github/hooks/workflow-enforcement.json`
- `.github/hooks/session-bootstrap.sh`
- `.github/hooks/enforce-agent-workflow.sh`
- `.github/agents/*.agent.md`

Cellix-specific policy still comes from:

- `orchestration.spec.yaml`
- `.agents/orchestration/model/orchestration-model.v1.json`
- `.github/instructions/orchestration-*.instructions.md`
- `AGENTS.md`

When working with AI agents:

- in Copilot CLI, explicitly select the `orchestrator` agent before giving a substantive development prompt when you want the repo orchestration workflow
- let the orchestrator delegate in the enforced order: `planner -> implementor -> reviewer -> [one repair cycle]`
- the workflow state lives in `.agents-work/current/`
- the required checkpoints are:
  - `plan.md`
  - `implementer.done`
  - `review.ok`
  - `review.feedback`
- planners should write `plan.md` and also return the exact plan between `BEGIN PLAN.MD` and `END PLAN.MD`
- implementors should write `implementer.done` and also return the exact checkpoint between `BEGIN IMPLEMENTER.DONE` and `END IMPLEMENTER.DONE`
- reviewers should write either `review.ok` or `review.feedback` and also return the exact checkpoint between the matching `BEGIN REVIEW.*` and `END REVIEW.*` markers
- the hook layer reconciles repo-visible checkpoints from those response blocks; do not invent separate checkpoint-repair subflows
- if a reviewer or implementor launch fails before writing its next checkpoint, retry the same delegate; the workflow preserves the prior checkpoint until reconciliation records the new verdict
- if a previous run already finished or checkpoint files were manually cleaned up into an impossible state, simply delegate the planner again; the hooks will reset that stale state automatically
- if a task spans both `packages/cellix/**` and application paths, split it into bounded phases instead of one blended plan
- prefer framework-first planning when app work depends on reusable `@cellix/*` changes
- use `bash .github/hooks/check-gate.sh status` to inspect the current checkpoint state when needed
- keep implementation validation targeted by default
- do not run `git commit` or `git push` during orchestrated sessions
- rely on the checkpoint hooks for workflow order; do not try to manually recreate the older `orchestration:hook` state machine during Copilot runs

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
- If you encounter this error when attempting to push changes `hook git error: Command failed with exit code 1: git commit -m REDACTED`, it indicates that pre-commit hooks have failed due to unmet code quality or security standards. Review the output from the hooks, fix the reported issues, and try committing again. Be aware that this error has nothing to do with firewall rules or network connectivity; it is expected to fail if your changes do not meet the project's standards.
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
