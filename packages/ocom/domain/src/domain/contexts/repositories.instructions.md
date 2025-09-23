---
applyTo: "packages/api-domain/src/domain/contexts/**/*.repository.ts"
---

# Copilot Instructions: Repositories

See the package-wide instructions in `.github/instructions/api-domain.instructions.md` for general rules, architecture, and conventions.

## Related Instructions
- `.github/instructions/contexts.instructions.md`
- `.github/instructions/aggregates.instructions.md`

## Purpose
- Repository interfaces define the contract for persistence and retrieval of aggregate roots within a bounded context.
- They abstract away infrastructure concerns, enabling domain logic to remain decoupled from data access implementations.
- Note that repository implementation details (e.g., database queries) should be handled in the infrastructure layer (`api-persistence`), not in the domain layer.

## Architecture & Patterns
- **Domain-Driven Design (DDD):** Repositories operate at the aggregate root level, providing methods for creation, retrieval, and other domain-specific operations.
- **Type Safety:** All repository interfaces are generic, parameterized by the aggregate/entity props type.
- **Ubiquitous Language:** Method names and parameters should reflect domain concepts and business requirements.

## Implementation Guidelines
- Extend the base `DomainSeedwork.Repository<T>` interface for the aggregate type.
- Define domain-specific methods for creation (`getNewInstance`), retrieval (`getById`, `getAll`, etc.), and other business-relevant queries.
- Use domain types for method parameters and return values (e.g., `EntityReference`, `Props`).
- Do not include infrastructure, persistence, or framework-specific code.
- Document all public APIs with JSDoc comments describing purpose, parameters, and return values.

## Example Patterns

### Generic Repository Interface
```typescript
export interface MyAggregateRepository<props extends MyAggregateProps>
	extends DomainSeedwork.Repository<MyAggregate<props>> {
	getNewInstance(/* required props for creation */) Promise<MyAggregate<props>>;
	getById(id: string): Promise<MyAggregate<props>>;
	// ...other domain-specific methods
    // getAll(): Promise<MyAggregate<props>[]>;
    // getBySomeCriteria(criteria: SomeCriteria): Promise<MyAggregate<props>[]>;
}
```

### Domain-Specific Methods
- Use domain types for parameters (e.g., `CommunityEntityReference`, `EndUserEntityReference`).
- Methods should reflect business use cases (e.g., `getAssignedToRole`, `getByIdWithCreatedBy`).

### Documentation
- Add JSDoc comments for each method, specifying domain context and expected behavior.

## Coding Conventions
- Use TypeScript generics for props.
- Use kebab-case for filenames: `{aggregate}.repository.ts`.
- Export all repository interfaces via the context-level `index.ts`.
- Do not include implementation logic—interfaces only.

## Testing
- Repository interfaces do not require direct unit tests, but all domain logic using repositories must be covered by aggregate/entity tests.
- Infrastructure implementations of repositories should be tested separately in `api-persistence`.