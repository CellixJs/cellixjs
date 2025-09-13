---
applyTo: "packages/api-domain/src/domain/contexts/**/*.uow.ts"
---

# Copilot Instructions: Unit of Works

See the package-wide instructions in `.github/instructions/api-domain.instructions.md` for general rules, architecture, and conventions.

## Related Instructions
- `.github/instructions/contexts.instructions.md`
- `.github/instructions/aggregates.instructions.md`
- `.github/instructions/repositories.instructions.md`

## Purpose
- Unit of Work interfaces define transactional boundaries for aggregate operations within a bounded context.
- They coordinate aggregate persistence, domain event dispatch, and integration event emission.
- They abstract away infrastructure concerns, ensuring domain logic remains decoupled from data access and transaction management.

## Architecture & Patterns
- **Domain-Driven Design (DDD):** Unit of Work operates at the aggregate root level, ensuring consistency and atomicity of domain operations.
- **Type Safety:** All Unit of Work interfaces are generic, parameterized by aggregate/entity props, aggregate type, repository type, and passport type.
- **Ubiquitous Language:** Method names and parameters should reflect domain concepts and business requirements.

## Implementation Guidelines
- Extend the base `DomainSeedwork.UnitOfWork<Passport, Props, Aggregate, Repository>` interface for the aggregate type.
- Use domain types for method parameters and return values (e.g., `Passport`, `Props`, `Aggregate`, `Repository`).
- Do not include infrastructure, persistence, or framework-specific code.
- Document all public APIs with JSDoc comments describing purpose, parameters, and return values.

## Example Patterns

### Generic Unit of Work Interface

```typescript
import type { DomainSeedwork } from '@cellix/domain-seedwork';
import type { Passport } from '../../passport.ts';
import type { MyAggregate, MyAggregateProps } from './my-aggregate.ts';
import type { MyAggregateRepository } from './my-aggregate.repository.ts';

/**
 * Represents the Unit of Work interface for the MyAggregate domain.
 * 
 * This interface extends the generic `DomainSeedwork.UnitOfWork` and provides
 * type bindings for Passport authentication, MyAggregate properties, MyAggregate entity,
 * and MyAggregate repository.
 *
 * @template Passport - The authentication context used for operations.
 * @template MyAggregateProps - The properties that define a MyAggregate.
 * @template MyAggregate - The MyAggregate AggregateRoot type.
 * @template MyAggregateRepository - The repository interface for MyAggregate aggregates.
 */
export interface MyAggregateUnitOfWork
  extends DomainSeedwork.UnitOfWork<
    Passport,
    MyAggregateProps,
    MyAggregate<MyAggregateProps>,
    MyAggregateRepository<MyAggregateProps>
  > {}
```

## Coding Conventions
- Use TypeScript generics for props, aggregate, repository, and passport types.
- Use kebab-case for filenames: `{aggregate}.uow.ts`.
- Export all unit of work interfaces via the context-level `index.ts`.
- Do not include implementation logic—interfaces only.
- Document all public APIs with JSDoc comments as shown in the example.

## Testing
- No testing required for Unit of Work interfaces
- Unit of Work implementations come from Cellix framework and are verified by the unit tests in `cellix-data-sources-mongoose`.

## References
- [DDD Patterns (Evans, Fowler)](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Unit of Work Pattern](https://martinfowler.com/eaaCatalog/unitOfWork.html)