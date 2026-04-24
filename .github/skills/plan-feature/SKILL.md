---
name: plan-feature
description: Reusable planning procedure for a new feature or significant change. Use when the task needs a scoped implementation plan with dependencies, risks, and validation steps.
---

# Skill: Plan Feature

Reusable procedure for planning a new feature or significant change.

## When to Use

- New bounded context or aggregate
- New GraphQL mutation/query
- New UI page or component
- Cross-cutting changes spanning multiple packages

## Procedure

### 1. Understand the Goal
- Read the user's request carefully
- Identify acceptance criteria (explicit or implied)
- Clarify ambiguities only if they materially change the implementation

### 2. Analyze the Codebase
- Read `.github/copilot-instructions.md` for project overview
- Search for similar existing implementations
- Identify which bounded contexts are involved
- Map the change to the package dependency order:
  ```
  @cellix/domain-seedwork -> @ocom/domain -> @ocom/persistence -> @ocom/graphql -> @apps/api
  @cellix/ui-core -> @ocom/ui-components -> @ocom/ui-community-route-* -> @apps/ui-community
  ```

### 3. Identify Instruction Files
For each affected area, locate the relevant instruction file:
- Domain: `packages/ocom/domain/domain.instructions.md`
- Contexts: `packages/ocom/domain/src/domain/contexts/contexts.instructions.md`
- GraphQL: `packages/ocom/graphql/.github/instructions/graphql.instructions.md`
- Persistence: `packages/ocom/persistence/.github/instructions/persistence.instructions.md`
- UI: `.github/instructions/ui/*.instructions.md`
- TypeScript: `.github/instructions/typescript.instructions.md`

### 4. Break Into Tasks
Follow dependency order and keep tasks small:

#### For Domain Changes
1. Value objects if new
2. Entity or aggregate if new or modified
3. Repository interface if new
4. Unit of Work if new
5. Passport/Visa definitions if authorization changes
6. Domain events if behavioral changes
7. Unit tests for domain logic

#### For Persistence Changes
1. Mongoose model if new entity
2. Repository implementation
3. Unit of Work implementation
4. Integration tests

#### For GraphQL Changes
1. Schema types and inputs (`.graphql` files)
2. Resolvers
3. Type generation (`codegen`)
4. Integration tests

#### For UI Changes
1. Shared components if reusable
2. GraphQL operations
3. Container components
4. Page components
5. Route registration
6. Component tests

### 5. Flag Risks
Mark each task with applicable flags:
- `security` for auth, input handling, or data access
- `breaking-change` for public API or shared interface changes
- `perf` for query or rendering impact
- `none` for routine implementation

### 6. Define Validation
```bash
pnpm run build
pnpm run test
pnpm run lint
```
