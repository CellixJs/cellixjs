---
sidebar_position: 19
sidebar_label: 0019 Monorepo Structure and Turborepo
description: "This MADR explains the decision to use a monorepo structure with Turborepo for build optimization and dependency management."
status: accepted
date: 2025-09-22
contact: gidich nnoce14
deciders: gidich etang93 mgupta83 nnoce14 iwilson dheruwala
---

# Monorepo Structure with Turborepo

## Context and Problem Statement

CellixJS is a complex Domain-Driven Design (DDD) application built on Azure Functions with multiple interconnected packages including domain models, API layers, persistence, GraphQL, and UI components. Initially, the codebase was organized in a way that made it difficult to manage dependencies, optimize builds, and maintain consistent development workflows across packages. We needed a scalable approach to:

- Manage shared code and dependencies across multiple packages
- Optimize build and test performance
- Maintain consistent tooling and configurations
- Enable efficient CI/CD pipelines
- Support both frontend and backend development workflows

The challenge was to choose between maintaining separate repositories or consolidating into a monorepo, and selecting appropriate tooling for build orchestration and caching.

## Decision Drivers

- **Build Performance**: Need for fast incremental builds and efficient caching
- **Dependency Management**: Shared code and consistent dependency versions across packages
- **Developer Experience**: Unified development environment and tooling
- **CI/CD Efficiency**: Selective builds and caching in automated pipelines
- **Code Organization**: Clear separation between application and library packages, with logical grouping
- **Scalability**: Ability to add new packages without architectural overhead

## Considered Options

- **NPM Workspaces**: Leverage NPM workspaces with typescript project references. Each package in `packages/` directory
- **Monorepo with Turborepo**: Focused build orchestration and caching tool. Repository structure following turborepo conventions

## Decision Outcome

We will use a monorepo structure with Turborepo for build orchestration, caching, and task management. The repository is organized with:

- `packages/` directory containing shared libraries and domain-specific packages
- `apps/` directory containing deployable applications
- Turborepo configuration for selective builds and dependency management
- npm workspaces for package management

See the following [Turborepo documentation](https://turbo.build/repo/docs/guides/tools) for reference.

## Consequences

### Positive

- **Improved Build Performance**: Turborepo's intelligent caching reduces build times by 50-80% for unchanged packages
- **Selective Execution**: Only affected packages and their dependents are built/tested
- **Unified Development Environment**: Single repository with consistent tooling and configurations
- **Efficient CI/CD**: Azure Pipelines integration with selective builds and remote caching
- **Better Dependency Management**: npm workspaces ensure consistent dependency versions
- **Clear Code Organization**: Logical separation between domain, application, and infrastructure concerns

### Negative

- **Increased Repository Size**: All packages in one repository can lead to larger clones
- **Complex Initial Setup**: Turborepo configuration requires careful task dependency management
- **Learning Curve**: Team needs to understand Turborepo concepts and selective execution
- **Potential for Tighter Coupling**: Monorepo can encourage tighter coupling between packages

## Validation

The monorepo structure and Turborepo usage is validated through:

- **Build Performance Metrics**: Local builds complete in ~160ms for cached packages
- **CI/CD Pipeline Efficiency**: PR builds are 30-60% faster due to selective execution
- **Code Quality Gates**: All packages maintain consistent linting, testing, and coverage standards
- **Dependency Resolution**: npm workspaces ensure no version conflicts between packages

## Pros and Cons of the Options

### NPM Workspaces

- **Good**: Built-in to npm, no additional tooling required
- **Good**: Simple setup with package.json workspaces field
- **Neutral**: Basic support for linking local packages
- **Bad**: No advanced build orchestration or caching
- **Bad**: Limited to package management only

### Monorepo with Turborepo

- **Good**: Excellent build performance with intelligent caching
- **Good**: Simple configuration and focused on build orchestration
- **Good**: Seamless CI/CD integration with remote caching
- **Good**: Fast and reliable for our package structure
- **Neutral**: Less code generation features compared to Nx
- **Bad**: Limited to build/task orchestration (no code generation)

## Repository Structure

The monorepo follows this structure:

```
packages/                      # Shared libraries  
├── cellix/                    # Shared seedwork libraries for CellixJS applications 
│   ├── domain-seedwork/       # Domain modeling base classes
│   ├── typescript-config/     # Shared TypeScript configurations
│   ├── vitest-config/         # Shared testing configurations
│   └── mock-*                 # Mocking utilities for local development
│   └── ui-core/               # Shared UI components
│   └── ...
├── ocom/                      # Application-specific packages (OwnerCommunity)
│   ├── domain/                # Domain models and business logic
│   ├── graphql/               # GraphQL schema and resolvers
│   ├── persistence/           # Data access layer
│   └── service-*              # Infrastructure services
|   └── ...

apps/                          # Deployable applications 
├── api/                       # Azure Functions application (Backend)
├── docs/                      # Documentation site (Docusaurus)
└── ui-community/              # React UI application (Frontend)
```

## Turborepo Configuration

### Task Dependencies

Turborepo manages task execution with dependency graphs:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

### Selective Execution

- **Local Development**: `turbo run build` builds only affected packages
- **CI/CD**: Azure Pipelines detects changes and builds selectively
- **Caching**: Local `.turbo` directory and remote Azure Cache@2

### Package Categories

Packages are categorized by tags for selective deployments:
- **frontend**: UI applications and components
- **backend**: API, domain, and infrastructure packages
- **mock**: Local development utilities
- **config**: Shared configurations
- **docs**: Documentation


## More Information

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Turborepo - Structuring a Repository](https://turborepo.com/docs/crafting-your-repository/structuring-a-repository)
- [Turborepo - Typescript](https://turborepo.com/docs/guides/tools/typescript)
- [npm Workspaces](https://docs.npmjs.com/cli/v9/using-npm/workspaces)
- [Azure Pipelines Integration](./0018-docusaurus-azure-pipeline-stages.md)