# MADR Examples

This document provides complete examples of well-structured MADRs following the CellixJS conventions.

## Example 1: Technology Selection MADR

**Filename:** `0024-react-query-state-management.md`

```markdown
---
sidebar_position: 24
sidebar_label: 0024 React Query State Management
description: "Use React Query for server state management in UI components"
status: accepted
contact: john.doe
date: 2024-11-15
deciders: jane.smith, patrick, alice.em
consulted: bob.frontend, charlie.backend
informed: dev-team
---

# Use React Query for Server State Management

## Context and Problem Statement

The UI layer currently manages server state using a combination of `useState`, `useEffect`, 
and custom hooks. This approach leads to:

1. **Boilerplate code**: 300+ lines of repetitive data fetching logic
2. **Inconsistent caching**: Each component implements its own caching strategy
3. **Race conditions**: Concurrent requests can cause stale data to override fresh data
4. **No optimistic updates**: Users wait for server responses before seeing UI changes

With 15+ data-heavy components planned for Q4, we need a standardized solution for server 
state management that reduces boilerplate and improves user experience.

## Decision Drivers

- **Developer Experience**: Reduce boilerplate and repetitive code
- **Performance**: Minimize unnecessary network requests through caching
- **User Experience**: Provide optimistic updates and background refetching
- **Maintainability**: Standardize data fetching patterns across the application
- **Type Safety**: Full TypeScript support for queries and mutations
- **DDD Alignment**: Must align with ADR-0003 (Domain-Driven Design)

## Considered Options

1. **React Query (TanStack Query)**
2. **Apollo Client** (GraphQL-focused)
3. **SWR** (Vercel's data fetching library)
4. **Keep existing custom hooks** (status quo)

## Decision Outcome

Chosen option: **React Query**, because it provides the best balance of features, performance, 
and developer experience for our REST/GraphQL hybrid API. It reduces boilerplate by ~60%, 
provides built-in caching and optimistic updates, and has excellent TypeScript support.

### Consequences

**Good:**
- Automatic background refetching keeps data fresh
- Built-in optimistic updates improve perceived performance
- DevTools for debugging queries and cache state
- Reduces boilerplate from ~300 lines to ~50 lines per component
- Works with both REST and GraphQL endpoints
- Excellent TypeScript support with typed hooks

**Bad:**
- Additional dependency (~40KB minified)
- Learning curve for team members unfamiliar with React Query
- Must configure cache invalidation strategies carefully

## Validation

Implementation will be validated by:
1. **Code Review**: All data fetching components use `useQuery` or `useMutation`
2. **Performance**: Lighthouse performance score remains >90
3. **Test Coverage**: 80% coverage for components using React Query
4. **Developer Survey**: Team feedback after 2 sprints shows satisfaction >4/5

## Pros and Cons of the Options

### React Query (TanStack Query)

Full-featured library for managing server state in React applications.

**Good:**
- Automatic caching with configurable TTL
- Built-in support for pagination, infinite queries, prefetching
- Optimistic updates with automatic rollback on error
- Works with REST and GraphQL APIs
- Excellent DevTools for debugging
- TypeScript support is first-class
- Active community and maintenance (50K+ GitHub stars)
- Aligns with ADR-0003 (DDD) by separating data fetching from domain logic

**Neutral:**
- Requires configuring query keys properly
- Cache invalidation strategy must be planned

**Bad:**
- Adds 40KB to bundle size
- Requires team training
- Not tightly integrated with GraphQL (unlike Apollo)

### Apollo Client

GraphQL-specific client with caching and state management.

**Good:**
- Best-in-class GraphQL support
- Normalized caching
- Excellent TypeScript code generation
- Subscription support
- Large ecosystem

**Neutral:**
- Heavy focus on GraphQL
- 80KB bundle size

**Bad:**
- Not optimized for REST APIs (we use both REST and GraphQL)
- Higher bundle size than alternatives
- More complex setup for hybrid REST/GraphQL usage
- Per ADR-0010, we don't exclusively use GraphQL

### SWR

Lightweight data fetching library by Vercel.

**Good:**
- Very small bundle size (~5KB)
- Simple API
- Good TypeScript support
- Auto-revalidation on focus

**Neutral:**
- Less feature-rich than React Query
- Smaller community

**Bad:**
- No built-in pagination or infinite queries (must implement manually)
- Less comprehensive DevTools
- Fewer advanced features (no query cancellation, parallel queries)
- Limited mutation support compared to React Query

### Keep Existing Custom Hooks

Continue using current `useState` + `useEffect` pattern.

**Good:**
- No new dependencies
- Team already familiar with pattern
- Full control over implementation

**Neutral:**
- Known patterns

**Bad:**
- 300+ lines of boilerplate per complex component
- Inconsistent caching strategies
- No standardized error handling
- No optimistic updates
- Race conditions require manual management
- Difficult to test
- Doesn't scale with growing number of data-heavy components

## More Information

### Migration Plan

1. **Phase 1** (Sprint 1): Install React Query, configure QueryClient
2. **Phase 2** (Sprint 2): Migrate 3 simple components, document patterns
3. **Phase 3** (Sprint 3-4): Migrate remaining components, team training
4. **Phase 4** (Sprint 5): Remove old custom hooks, performance validation

### Implementation Guidelines

```typescript
// Example query setup
import { useQuery } from '@tanstack/react-query';

const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserProfile(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Example mutation with optimistic update
const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateUserProfile,
    onMutate: async (newProfile) => {
      await queryClient.cancelQueries({ queryKey: ['user', newProfile.id] });
      const previousProfile = queryClient.getQueryData(['user', newProfile.id]);
      queryClient.setQueryData(['user', newProfile.id], newProfile);
      return { previousProfile };
    },
    onError: (err, newProfile, context) => {
      queryClient.setQueryData(['user', newProfile.id], context.previousProfile);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
    },
  });
};
```

### Related ADRs

- [ADR-0003: Domain-Driven Design](./0003-domain-driven-design.md) - React Query aligns 
  with DDD by separating data fetching concerns from domain logic
- [ADR-0010: React Router Loaders](./0010-react-router-loaders.md) - React Query works 
  alongside router loaders for initial data

### References

- [React Query Documentation](https://tanstack.com/query/latest)
- [React Query Comparison](https://tanstack.com/query/latest/docs/react/comparison)
- [Migration Guide from Custom Hooks](https://tanstack.com/query/latest/docs/react/guides/migrating-to-react-query-3)
```

---

## Example 2: Pattern Adoption MADR

**Filename:** `0025-repository-pattern-data-access.md`

```markdown
---
sidebar_position: 25
sidebar_label: 0025 Repository Pattern for Data Access
description: "Adopt Repository Pattern for database access in domain layer"
status: proposed
contact: alice.backend
date: 2024-11-20
deciders: bob.architect, patrick, alice.em
consulted: charlie.ddd, david.infra
informed: backend-team
---

# Adopt Repository Pattern for Database Access

## Context and Problem Statement

The current domain layer directly accesses Mongoose models, creating tight coupling between 
domain logic and data persistence. This violates ADR-0003 (Domain-Driven Design) principles 
and makes it difficult to:

1. Test domain logic without database dependencies
2. Switch persistence technologies (e.g., from Mongoose to TypeORM)
3. Implement CQRS patterns (separate read and write models)
4. Enforce aggregate boundaries

We need an abstraction layer that decouples domain logic from persistence concerns while 
maintaining the DDD patterns established in ADR-0003.

## Decision Drivers

- **DDD Compliance**: Must align with ADR-0003 aggregate and bounded context patterns
- **Testability**: Enable testing domain logic without database
- **Flexibility**: Allow future migration to different persistence technologies
- **Performance**: Must not significantly impact query performance
- **Developer Experience**: Should be intuitive for team to use
- **CQRS Readiness**: Prepare for future CQRS implementation

## Considered Options

1. **Repository Pattern** with TypeScript interfaces
2. **Active Record Pattern** (Mongoose models with methods)
3. **Data Mapper Pattern** (TypeORM-style)
4. **Keep current direct Mongoose access**

## Decision Outcome

Chosen option: **Repository Pattern with TypeScript interfaces**, because it provides the 
best balance of DDD compliance, testability, and flexibility. It aligns with ADR-0003 by 
enforcing aggregate boundaries and allows us to prepare for CQRS (ADR-TBD).

### Consequences

**Good:**
- Clear separation between domain and persistence layers
- Easy to mock repositories in tests
- Enforces aggregate boundaries from ADR-0003
- Prepares for CQRS implementation
- Allows switching persistence technologies

**Bad:**
- Additional abstraction layer adds boilerplate
- Team must learn repository pattern
- May require refactoring existing domain logic

## Validation

Implementation validated by:
1. **ArchUnit Tests**: Verify domain layer doesn't import Mongoose directly
2. **Test Coverage**: 90%+ coverage for domain logic using mocked repositories
3. **Code Review**: All aggregates use repository interfaces
4. **Performance**: Database query performance within 10% of current baseline

## Pros and Cons of the Options

### Repository Pattern with TypeScript Interfaces

Define repository interfaces in domain layer, implement in infrastructure layer.

**Good:**
- Perfect alignment with DDD aggregate pattern (ADR-0003)
- Domain layer has zero persistence dependencies
- Easy to test with mocked repositories
- Enforces aggregate boundaries
- Allows multiple persistence implementations
- Prepares for CQRS read/write model separation

**Neutral:**
- Requires defining interfaces and implementations
- Standard pattern, widely documented

**Bad:**
- Additional boilerplate (~50 lines per aggregate)
- Team must learn pattern
- Risk of leaky abstractions if not designed carefully

### Active Record Pattern

Mongoose models with business logic methods.

**Good:**
- Simple and direct
- Less boilerplate
- Team already familiar

**Neutral:**
- Common in Rails, Django

**Bad:**
- Violates DDD principles from ADR-0003
- Domain logic tightly coupled to Mongoose
- Difficult to test without database
- Doesn't enforce aggregate boundaries
- Can't easily switch persistence technologies

### Data Mapper Pattern

TypeORM-style separation of entities and mappers.

**Good:**
- Clean separation of entities and persistence
- TypeORM has excellent TypeScript support
- Supports migrations

**Neutral:**
- Different from current Mongoose usage

**Bad:**
- Requires migrating from Mongoose to TypeORM
- More complex than repository pattern
- Higher learning curve
- May require rewriting existing code

### Keep Current Direct Mongoose Access

Continue accessing Mongoose models directly from domain layer.

**Good:**
- No changes required
- Team familiar with approach
- No additional abstractions

**Neutral:**
- Current status quo

**Bad:**
- Violates ADR-0003 DDD principles
- Domain layer coupled to Mongoose
- Difficult to test without database
- Can't switch persistence technologies
- Doesn't enforce aggregate boundaries
- Blocks CQRS implementation

## More Information

### Implementation Example

```typescript
// Domain layer: Repository interface
// File: packages/domain/src/contexts/user/user.repository.ts

export interface IUserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: UserId): Promise<void>;
}

// Domain layer: Aggregate using repository
// File: packages/domain/src/contexts/user/user.ts

export class User {
  constructor(
    private readonly id: UserId,
    private email: Email,
    private profile: UserProfile
  ) {}

  updateEmail(newEmail: Email): void {
    // Domain logic here
    this.email = newEmail;
  }

  // No persistence logic in domain
}

// Infrastructure layer: Repository implementation
// File: packages/infrastructure/src/repositories/user.repository.impl.ts

export class UserMongooseRepository implements IUserRepository {
  constructor(private readonly userModel: Model<UserDocument>) {}

  async findById(id: UserId): Promise<User | null> {
    const doc = await this.userModel.findById(id.value);
    return doc ? this.toDomain(doc) : null;
  }

  async save(user: User): Promise<void> {
    const doc = this.toPersistence(user);
    await this.userModel.findByIdAndUpdate(user.id.value, doc, { upsert: true });
  }

  private toDomain(doc: UserDocument): User {
    // Map Mongoose document to domain entity
  }

  private toPersistence(user: User): UserDocument {
    // Map domain entity to Mongoose document
  }
}
```

### Migration Plan

1. **Phase 1**: Define repository interfaces for core aggregates (User, Property)
2. **Phase 2**: Implement Mongoose-based repositories
3. **Phase 3**: Update domain services to use repositories
4. **Phase 4**: Add ArchUnit tests to enforce pattern
5. **Phase 5**: Migrate remaining aggregates

### Related ADRs

- [ADR-0003: Domain-Driven Design](./0003-domain-driven-design.md) - Repository pattern 
  enforces aggregate boundaries defined in this ADR
- [ADR-0002: OpenTelemetry](./0002-open-telemetry.md) - Repository implementations can 
  add tracing spans

### References

- [Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/ddd/)
- [Implementing Domain-Driven Design by Vaughn Vernon](https://vaughnvernon.com/iddd/)
- [Repository Pattern in TypeScript](https://khalilstemmler.com/articles/typescript-domain-driven-design/repository-dto-mapper/)
```

---

## Example 3: Infrastructure Decision MADR (Short Form)

**Filename:** `0026-redis-caching.md`

```markdown
---
sidebar_position: 26
sidebar_label: 0026 Redis Caching
description: "Use Redis for application-level caching"
status: accepted
date: 2024-12-01
deciders: alice.em, patrick
consulted: bob.infra
---

# Use Redis for Application-Level Caching

## Context and Problem Statement

Query response times exceed 2 seconds for complex property searches due to expensive 
database aggregations. We need a caching layer to improve performance.

## Considered Options

- Redis
- In-memory cache (node-cache)
- Azure Cache for Redis (managed)

## Decision Outcome

Chosen option: **Azure Cache for Redis**, because it provides managed Redis with high 
availability, aligns with our Azure infrastructure (ADR-0014), and supports future 
distributed caching needs.

### Consequences

**Good:**
- Managed service (no ops overhead)
- Reduces query times from 2s to <200ms
- Supports future microservices architecture

**Bad:**
- Additional Azure cost (~$20/month for basic tier)
- Requires cache invalidation strategy

## More Information

- Cache TTL: 5 minutes for search results
- Invalidation: On property updates via event handlers
- Related: [ADR-0014: Azure Infrastructure](./0014-azure-infrastructure-deployments.md)
```

---

## Key Takeaways from Examples

### Common Patterns

1. **Clear Problem Statement**: Start with specific, measurable problems
2. **Quantified Impact**: Use metrics (300+ lines, 60% reduction, <100ms)
3. **Multiple Options**: Always consider at least 2 alternatives
4. **Alignment with Existing MADRs**: Reference related decisions
5. **Validation Criteria**: Define how success will be measured
6. **Migration Plans**: Include implementation roadmap for complex changes

### Template Selection Guide

**Use Full Template when:**
- Decision has significant architectural impact
- Multiple complex options need detailed analysis
- Migration plan required
- Multiple stakeholders need convincing

**Use Short Template when:**
- Decision is straightforward
- Clear winner among options
- Low architectural impact
- Quick consensus expected

### Status Progression Examples

**Typical Flow:**
```
proposed → accepted → (eventually) deprecated → superseded
```

**Alternative Flow:**
```
proposed → rejected (document why alternative wasn't chosen)
```

### Writing Style Tips

1. **Be Specific**: "Reduces boilerplate by 60%" vs "Reduces boilerplate"
2. **Be Measurable**: "Query time <200ms" vs "Faster queries"
3. **Be Honest**: Include real cons, not just token objections
4. **Be Forward-Looking**: Reference future plans (CQRS, microservices)
5. **Be Connected**: Link to related ADRs for context
