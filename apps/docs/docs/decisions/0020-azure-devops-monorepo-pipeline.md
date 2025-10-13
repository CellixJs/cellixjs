---
sidebar_position: 20
sidebar_label: 0020 Azure DevOps Monorepo Pipeline
description: "Architecture Decision Record for Azure DevOps monorepo CI/CD pipeline design and conditional deployment strategy."
status: accepted
contact: gidich nnoce14
date: 2025-10-08
deciders: gidich etang93 mgupta83 nnoce14 iwilson dheruwala
consulted: etang93 mgupta83
informed: 
---

# Azure DevOps Monorepo Pipeline Architecture

## Context and Problem Statement

CellixJS is a monorepo containing multiple applications (API, UI Community, Docs) and shared packages with complex interdependencies. The CI/CD pipeline needed to efficiently handle builds and deployments while:

- Only building and deploying applications that have actual changes
- Optimizing build times through intelligent caching
- Supporting both pull request validation and main branch deployments
- Maintaining reliability and avoiding missed deployments
- Integrating with Turborepo's dependency graph analysis
- Managing different deployment targets (Azure Functions, Static Web Apps, GitHub Pages)

The challenge was designing a pipeline that could intelligently detect changes in a monorepo structure and conditionally execute deployment stages without sacrificing reliability or developer experience.

## Decision Drivers

- **Build Efficiency**: Avoid unnecessary builds and deployments for unchanged applications
- **Reliability**: Ensure no deployments are missed due to incorrect change detection
- **Caching Strategy**: Maximize cache hits for dependencies, tools, and build outputs
- **Developer Experience**: Fast PR builds and clear feedback on pipeline status
- **Maintainability**: Simple pipeline structure that's easy to understand and modify
- **Integration with Turborepo**: Leverage existing dependency graph analysis
- **Multi-environment Support**: Support different deployment configurations (dev, qa, prod)

## Considered Options

1. **Single Pipeline with Manual Conditions**: All applications deployed every time with manual skip conditions
2. **Separate Pipelines per Application**: Individual pipelines triggered by path-based filters
3. **Conditional Deployment with Change Detection**: Single pipeline with intelligent change detection and conditional stages
4. **Matrix Strategy**: Use Azure DevOps matrix jobs to parallelize different application deployments

## Decision Outcome

Chosen option: **Conditional Deployment with Change Detection**, implemented through:

### Pipeline Architecture
- **Single main pipeline** (`azure-pipelines.yml`) with template-based stage organization
- **Monorepo build stage** (`monorepo-build-stage.yml`) handles all build operations
- **Monorepo deployment stage** (`monorepo-deployment-stage.yml`) orchestrates conditional deployments
- **Change detection script** (`detect-changes.cjs`) uses Turborepo to determine affected applications

### Change Detection Strategy
```javascript
// Turborepo-based affected package detection
const turboCommand = `npx turbo run build --affected --dry-run=json`;

// Per-application dependency scope analysis
const scopeCommand = `npx turbo run build --filter=${appConfig.filter} --dry-run=json`;

// Pipeline variables for conditional execution
setPipelineVariable('HAS_BACKEND_CHANGES', hasBackendChanges);
setPipelineVariable('HAS_FRONTEND_CHANGES', hasFrontendChanges);
setPipelineVariable('HAS_DOCS_CHANGES', hasDocsChanges);
```

### Conditional Deployment Logic
```yaml
# Build artifacts only for affected applications
condition: and(succeeded(), eq(variables['BuildJob.HAS_BACKEND_CHANGES'], 'true'))

# Deploy only affected applications
condition: eq(stageDependencies.Build.Build.outputs['BuildJob.HAS_FRONTEND_CHANGES'], 'true')
```

### Caching Strategy
- **PNPM Cache**: Dependency installation caching with pnpm store-dir optimization
- **Turborepo Cache**: Local build output caching persisted via Azure Cache@2 task
- **Tool Caches**: Azure Functions Core Tools, Java JRE, SonarCloud scanner, Playwright browsers
- **Intelligent Cache Keys**: Version-controlled cache keys with hierarchical fallback strategies

## Consequences

### Positive
- **Resource Efficiency**: Only affected applications consume deployment resources through conditional execution
- **Scalable Architecture**: Template-based structure allows adding new applications without modifying core pipeline logic
- **Integrated Change Detection**: Uses Turborepo's dependency graph analysis for determining affected packages
- **Clear Pipeline Structure**: Template-based organization with separation between build and deployment concerns

### Negative
- **Complex Change Detection Logic**: Sophisticated logic required to avoid missed deployments, including fallback strategies
- **Debugging Complexity**: Conditional execution can make pipeline debugging more challenging
- **Cache Dependencies**: Pipeline relies on multiple caching layers (PNPM, Turborepo, tools, browsers)
- **Monorepo Coupling**: All applications share the same pipeline lifecycle and dependency detection

## Validation

The pipeline architecture includes:

### Quality Gates
- **SonarCloud Integration**: Code quality and security analysis with `sonarcloud-buildbreaker@2` task for quality gate enforcement
- **Test Coverage**: Test execution through Turborepo's task orchestration for affected packages
- **Artifact Validation**: Build artifacts only created for applications with detected changes

### Deployment Reliability
- **Fallback Strategy**: Conservative deployment assumption on change detection failures (sets all applications as affected)
- **Environment Propagation**: Environment variables passed through pipeline stages using Azure DevOps variable groups
- **Dependency Management**: Infrastructure deployment jobs run before application deployment jobs

## Pros and Cons of the Options

### Single Pipeline with Manual Conditions

- **Good**: Simple pipeline structure, no complex logic required
- **Good**: Guaranteed consistent deployment behavior
- **Bad**: Wastes resources on unnecessary deployments
- **Bad**: Slower build times due to redundant operations

### Separate Pipelines per Application

- **Good**: Complete isolation between application deployments
- **Good**: Simple path-based triggering
- **Bad**: Difficult to manage shared dependencies and infrastructure
- **Bad**: No coordination between related deployments
- **Bad**: Duplicated pipeline logic across applications

### Conditional Deployment with Change Detection

- **Good**: Optimal resource utilization and build performance
- **Good**: Integrates naturally with Turborepo's dependency analysis
- **Good**: Maintains single source of truth for pipeline logic
- **Good**: Supports complex interdependency scenarios
- **Neutral**: Requires sophisticated change detection logic
- **Bad**: More complex debugging and troubleshooting

### Matrix Strategy

- **Good**: Parallel execution of different application deployments
- **Neutral**: Could be combined with conditional deployment strategy
- **Bad**: Complex coordination between matrix jobs
- **Bad**: Difficult to handle shared infrastructure dependencies

## Pipeline Structure

### Main Pipeline (`azure-pipelines.yml`)
```yaml
stages:
  - template: ./build-pipeline/core/monorepo-build-stage.yml
    parameters:
      # Build configuration and caching parameters
  - template: ./build-pipeline/core/monorepo-deployment-stage.yml
    parameters:
      # Environment-specific deployment parameters
```

### Application-Specific Deployment Templates
- `apps/api/deploy-api.yml`: Azure Functions deployment with infrastructure setup
- `apps/ui-community/deploy-ui-community.yml`: Static Web App deployment to Azure Storage
- `apps/docs/deploy-docs.yml`: GitHub Pages deployment for documentation

### Change Detection Workflow
1. **Determine Build Context**: PR vs. push build, set appropriate comparison base
2. **Run Turborepo Analysis**: Get globally affected packages using `--affected --dry-run=json`
3. **Compute Application Scopes**: For each app, get dependency scope using `--filter`
4. **Calculate Intersections**: Determine which applications have affected dependencies
5. **Set Pipeline Variables**: Expose boolean flags for conditional stage execution
6. **Fallback Strategy**: On detection errors, conservatively assume all applications affected

## More Information

### Related ADRs
- [ADR-0019: Monorepo Structure and Turborepo](./0019-monorepo-turborepo.md) - Foundation for build optimization
- [ADR-0014: Azure Infrastructure Deployments](./0014-azure-infrastructure-deployments.md) - Infrastructure deployment approach
- [ADR-0018: Docusaurus Azure Pipeline Stages](./0018-docusaurus-azure-pipeline-stages.md) - Documentation deployment strategy

### Key Implementation Files
- `azure-pipelines.yml` - Main pipeline definition
- `build-pipeline/core/monorepo-build-stage.yml` - Build orchestration template
- `build-pipeline/core/monorepo-deployment-stage.yml` - Deployment orchestration template
- `build-pipeline/scripts/detect-changes.cjs` - Change detection logic
- Application-specific deployment templates in `apps/*/deploy-*.yml`

### External Dependencies
- [Azure DevOps Pipelines](https://docs.microsoft.com/en-us/azure/devops/pipelines/)
- [Turborepo Affected Commands](https://turbo.build/repo/docs/reference/command-line-reference#turbo-run-task---affected)
- [Azure Cache@2 Task](https://docs.microsoft.com/en-us/azure/devops/pipelines/tasks/utility/cache)
- [SonarCloud Integration](https://docs.sonarcloud.io/advanced-setup/ci-based-analysis/azure-devops-integration/)