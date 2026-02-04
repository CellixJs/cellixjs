---
name: madr-enforcement
description: >
  Enforces architectural standards and guidelines defined in MADRs (Markdown Any Decision Records) 
  when writing, reviewing, or modifying code in CellixJS. Use this skill when: (1) writing new code 
  to ensure it follows documented architectural decisions, (2) reviewing code to verify compliance 
  with ADR standards, (3) refactoring to align with established patterns, (4) making architectural 
  decisions that may require creating new ADRs.
license: MIT
compatibility: Works with MADR-based projects following MADR 3.0.0 specification
metadata:
  author: CellixJS Team
  version: "1.0"
  repository: https://github.com/CellixJs/cellixjs
allowed-tools: Bash(npm:*) Bash(npx:*) Bash(pnpm:*) Read Write Edit Glob Grep
---

# MADR Enforcement Skill

This skill ensures that code written in the CellixJS project adheres to the architectural standards, patterns, 
and guidelines documented in our Markdown Any Decision Records (MADRs). All ADRs are located in 
`apps/docs/docs/decisions/` and represent binding architectural decisions that must be followed.

## When to Use This Skill

Use this skill when:

- **Writing new code** - Ensure it follows established architectural patterns from ADRs
- **Reviewing pull requests** - Verify code compliance with documented standards
- **Refactoring existing code** - Align implementations with current ADRs
- **Adding dependencies** - Check against technology choices documented in ADRs
- **Making design decisions** - Verify alignment or identify need for new ADR
- **Implementing features** - Follow patterns from relevant domain/infrastructure ADRs

## CellixJS Architectural Decisions (ADRs)

All architectural decisions are documented in `apps/docs/docs/decisions/`. The following ADRs define 
standards that **MUST** be enforced in code:

### Architecture & Design Patterns

#### ADR-0003: Domain-Driven Design (DDD)

**Standards to Enforce:**

1. **Bounded Contexts** - Code must be organized by bounded context
   - Location: `packages/ocom/domain/contexts/{context-name}/`
   - Each context has its own ubiquitous language
   
2. **Entity Structure** - Entities must follow DDD patterns
   - File: `{entity}.ts`
   - Must have unique identity (ID)
   - Contains business logic methods
   - Props interface defines state
   
3. **Value Objects** - Immutable objects defined by their values
   - File: `{entity}.value-objects.ts`
   - Must be immutable
   - Use `@lucaspaganini/value-objects` framework
   
4. **Aggregate Roots** - Entry points for entity clusters
   - File: `{entity}.ts` (aggregate root entities)
   - Enforces business rules for the aggregate
   - Guards integrity of related entities
   
5. **Unit of Work Pattern** - Atomic operations on domain models
   - File: `{entity}.uow.ts`
   - Transaction boundary for persistence
   - One per aggregate root

6. **Layer Separation**
   - **Domain Layer**: Business logic only, no infrastructure
   - **Application Service Layer**: Orchestration, coordinates use cases
   - **Infrastructure Service Layer**: External systems, third-party APIs

**Code Review Checklist:**
- [ ] Is code organized by bounded context?
- [ ] Do entities have unique identifiers?
- [ ] Are value objects immutable?
- [ ] Are aggregate boundaries respected?
- [ ] Is domain logic separate from infrastructure?
- [ ] Are Unit of Work patterns used for persistence?

#### ADR-0019: MonoRepo and Turborepo

**Standards to Enforce:**

1. **Package Organization**
   - Workspace structure defined in `pnpm-workspace.yaml`
   - Package naming: `@ocom/*` or `@cellix/*`
   
2. **Build System**
   - Use Turborepo for builds: `pnpm run build`
   - Respect package dependencies
   - Use affected builds: `pnpm run build:affected`
   
3. **Testing**
   - Package-level tests in each workspace
   - Use `pnpm run test:affected`
   - Coverage reports per package

**Code Review Checklist:**
- [ ] Is new code in the correct workspace package?
- [ ] Are package dependencies declared in package.json?
- [ ] Do build scripts use Turborepo commands?
- [ ] Are tests co-located with the code they test?

### Code Quality & Standards

#### ADR-0012: Biome for Linting

**Standards to Enforce:**

1. **Linting and Formatting**
   - Use Biome (not ESLint or Prettier)
   - Configuration in `biome.json`
   - Run before commits: `pnpm run lint`
   
2. **Type Safety**
   - Biome provides type-aware linting
   - Strict TypeScript configuration
   - No `any` types without justification
   
3. **Code Style**
   - Tab indentation (per biome.json)
   - Follow Biome's formatting rules
   - Auto-fix with `pnpm run format`

**Code Review Checklist:**
- [ ] Does code pass Biome linting?
- [ ] Is code formatted with Biome?
- [ ] Are TypeScript types strict and complete?
- [ ] No ESLint or Prettier configurations added?

#### ADR-0013: Test Suite Architecture

**Standards to Enforce:**

1. **Test Framework**
   - Use Vitest for unit tests
   - Test coverage via `pnpm run test:coverage`
   
2. **Test Organization**
   - Unit tests: Co-located with source files
   - Integration tests: Separate directory
   - E2E tests: SerenityJS (ADR-0007)
   
3. **Coverage Requirements**
   - Coverage reports in `packages/*/coverage/`
   - Minimum coverage thresholds enforced

**Code Review Checklist:**
- [ ] Are unit tests written for new code?
- [ ] Do tests use Vitest framework?
- [ ] Is test coverage adequate?
- [ ] Are tests co-located appropriately?

#### ADR-0022: Snyk Security Integration

**Standards to Enforce:**

1. **Security Scanning**
   - Run Snyk before commits: `pnpm run snyk`
   - Includes SAST (code), SCA (dependencies), IaC (Bicep)
   
2. **Vulnerability Management**
   - Fix critical/high vulnerabilities immediately
   - Document exceptions in `.snyk` file
   - Get CODEOWNERS approval for ignores
   
3. **Workflow**
   - Scan during development with `snyk_code_scan` MCP tool
   - Verify fixes with re-scan
   - Pass Snyk gate before commit

**Code Review Checklist:**
- [ ] Does code pass Snyk security scans?
- [ ] Are vulnerabilities addressed or documented?
- [ ] Are new dependencies scanned with `gh-advisory-database` MCP tool?
- [ ] Are suppressed issues justified with expiration?

### Infrastructure & Technology

#### ADR-0002: OpenTelemetry

**Standards to Enforce:**

1. **Observability**
   - Use `@azure/monitor-opentelemetry`
   - Automatic instrumentation for MongoDB, Azure Functions
   - GraphQL tracing via Apollo Server
   
2. **Integration**
   - Package: `@ocom/service-otel`
   - Configured via OpenTelemetry SDK

**Code Review Checklist:**
- [ ] Are new services instrumented with OpenTelemetry?
- [ ] Is tracing configured for external calls?
- [ ] Are metrics and logs properly structured?

#### ADR-0011: Bicep for Infrastructure as Code

**Standards to Enforce:**

1. **IaC Language**
   - Use Bicep (not ARM templates, Terraform)
   - Location: `iac/` directory
   
2. **Resource Naming**
   - Follow naming conventions in ADR-0021
   - Use resource scoping strategy
   
3. **Deployment**
   - Azure infrastructure deployments per ADR-0014
   - CI/CD via Azure DevOps (ADR-0020)

**Code Review Checklist:**
- [ ] Is infrastructure defined in Bicep?
- [ ] Do resource names follow conventions?
- [ ] Are Bicep files scanned with Snyk IaC?

#### ADR-0014: Azure Infrastructure Deployments

**Standards to Enforce:**

1. **Azure Functions**
   - Version 4.x
   - TypeScript runtime
   - Registered via `cellix.registerAzureFunctionHandler()`
   
2. **Service Registration**
   - Use `Cellix` class for DI orchestration
   - Register services with `serviceRegistry.registerService()`
   
3. **Context Specification**
   - Define context via `setContext()`
   - Provide typed service access

**Code Review Checklist:**
- [ ] Are Azure Functions v4 patterns followed?
- [ ] Is dependency injection used correctly?
- [ ] Are services registered properly?

### Technology Choices

#### ADR-0004: Identity and Access Management
#### ADR-0005: Authorization

**Standards to Enforce:**

1. **Authentication**
   - Follow IAM patterns from ADR-0004
   
2. **Authorization**
   - Implement authorization per ADR-0005

**Code Review Checklist:**
- [ ] Is authentication implemented correctly?
- [ ] Are authorization checks in place?
- [ ] Do security patterns match ADRs?

#### ADR-0010: React Router Loaders

**Standards to Enforce:**

1. **Data Loading**
   - Use React Router loaders for initial data
   - Co-locate with route definitions
   
2. **UI Patterns**
   - Loader functions return route data
   - Components access via `useLoaderData()`

**Code Review Checklist:**
- [ ] Are loaders used for data fetching?
- [ ] Is data loading co-located with routes?

## Code Enforcement Workflow

### When Writing New Code

1. **Identify Relevant ADRs**
   - Search `apps/docs/docs/decisions/` for applicable standards
   - Read ADRs related to your domain, technology, or pattern
   
2. **Apply ADR Standards**
   - Follow file naming conventions
   - Use documented patterns
   - Respect layer boundaries
   
3. **Verify Compliance**
   - Run linting: `pnpm run lint`
   - Run tests: `pnpm run test`
   - Run security scan: `pnpm run snyk`
   - Full verification: `pnpm run verify`

### When Reviewing Code

1. **Check ADR Alignment**
   - Identify which ADRs apply to the changes
   - Verify code follows documented patterns
   
2. **Common Violations**
   - Domain logic in infrastructure layer (violates ADR-0003)
   - Using ESLint instead of Biome (violates ADR-0012)
   - Missing tests (violates ADR-0013)
   - Unscanned dependencies (violates ADR-0022)
   - Not using Bicep for infrastructure (violates ADR-0011)
   
3. **Request Changes**
   - Reference specific ADR in review comments
   - Explain which standard is violated
   - Suggest corrective action

### When Making Architectural Decisions

1. **Check Existing ADRs**
   - Search for related decisions
   - Verify no conflicts with current ADRs
   
2. **Determine if New ADR Needed**
   - New framework/library adoption → Requires ADR
   - New architectural pattern → Requires ADR
   - Infrastructure changes → Requires ADR
   - Refactoring without architectural impact → No ADR needed
   
3. **Create ADR if Required**
   - Follow process in ADR-0001
   - Use templates in `apps/docs/docs/decisions/`
   - Get approval from deciders before implementing

## ADR Index by Category

### Architecture & Design
- **ADR-0003**: Domain-Driven Design (DDD)
- **ADR-0019**: MonoRepo and Turborepo

### Code Quality & Security
- **ADR-0012**: Biome linting
- **ADR-0013**: Test suite architecture
- **ADR-0015**: SonarCloud integration
- **ADR-0016**: SonarCloud code duplication
- **ADR-0022**: Snyk security integration

### Infrastructure & DevOps
- **ADR-0002**: OpenTelemetry observability
- **ADR-0011**: Bicep for IaC
- **ADR-0014**: Azure infrastructure deployments
- **ADR-0018**: Docusaurus Azure pipeline
- **ADR-0020**: Azure DevOps monorepo pipeline
- **ADR-0021**: Bicep resource scoping

### Technology & Tools
- **ADR-0004**: Identity and access management
- **ADR-0005**: Authorization patterns
- **ADR-0006**: Maps integration
- **ADR-0007**: SerenityJS testing
- **ADR-0008**: White-label architecture
- **ADR-0009**: Cache purging
- **ADR-0010**: React Router loaders
- **ADR-0017**: Chrome content overrides
- **ADR-0023**: TsGo migration

### Process & Documentation
- **ADR-0001**: MADR for architectural decisions

## Common Code Patterns by ADR

### DDD Pattern (ADR-0003)

**Correct Implementation:**
```typescript
// packages/ocom/domain/contexts/user/user.ts
export interface UserProps {
  readonly id: UserId;
  readonly email: Email;
  readonly profile: UserProfile;
}

export class User implements AggregateRoot<UserProps> {
  constructor(private props: UserProps) {}
  
  get id(): UserId { return this.props.id; }
  
  updateEmail(newEmail: Email): void {
    // Domain logic here
    this.props = { ...this.props, email: newEmail };
  }
  
  // No database or infrastructure code here!
}
```

**Incorrect Implementation (violates ADR-0003):**
```typescript
// ❌ WRONG: Domain entity with database code
export class User {
  async save(): Promise<void> {
    await mongoose.model('User').save(this); // Infrastructure in domain!
  }
}
```

### Service Registration (ADR-0014)

**Correct Implementation:**
```typescript
// Proper dependency injection
Cellix.initializeServices<ApiContextSpec>((serviceRegistry) => {
  serviceRegistry.registerService(new ServiceMongoose(...));
  serviceRegistry.registerService(new ServiceOtel(...));
})
.setContext((serviceRegistry) => ({ 
  domainDataSource: contextBuilder(serviceRegistry.getService(ServiceMongoose)),
  telemetry: serviceRegistry.getService(ServiceOtel)
}));
```

### Turborepo Usage (ADR-0019)

**Correct Commands:**
```bash
# Build all packages
pnpm run build

# Build only affected packages
pnpm run build:affected

# Test with turbo caching
pnpm run test
```

**Incorrect:**
```bash
# ❌ WRONG: Building individual packages directly
cd packages/ocom/domain && npm run build
```

## Enforcement During Code Generation

When generating code:

1. **Start with ADR Review**
   - Identify applicable ADRs for the task
   - Read relevant sections
   
2. **Generate Code Following Standards**
   - Use patterns from ADRs
   - Follow file naming conventions
   - Respect layer boundaries
   
3. **Verify Compliance**
   - Check code against ADR requirements
   - Run verification suite
   - Reference ADRs in comments if needed

## References

### Internal Documentation
- **All ADRs**: `apps/docs/docs/decisions/`
- **ADR-0001**: MADR Architecture Decisions (process for creating ADRs)
- **ADR Templates**: `apps/docs/docs/decisions/adr-template.md`

### External Resources
- [MADR Project](https://adr.github.io/madr/)
- [Domain-Driven Design](https://www.domainlanguage.com/ddd/)
- [Biome Documentation](https://biomejs.dev/)
- [Turborepo Documentation](https://turbo.build/)
