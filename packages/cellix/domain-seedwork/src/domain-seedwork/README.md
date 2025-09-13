## Domain Seedwork: API and Usage Guide

This package provides foundational, framework-agnostic building blocks for Domain-Driven Design (DDD) across the Cellix monorepo. It standardizes aggregates, entities, value objects, events, repositories, and units of work, and is intentionally free of infrastructure concerns.

If you’re new to DDD, these are helpful references:
- [Microsoft DDD Seedwork overview](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/seedwork-domain-model-base-classes-interfaces)
- [Domain-Driven Design Reference (Eric Evans)](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf)
- [Martin Fowler on Seedwork](https://martinfowler.com/bliki/Seedwork.html)

Import pattern:
- `import { DomainSeedwork } from '@cellix/domain-seedwork'`

---

## Domain Seedwork API

### Pedigree Legend

Cellix implements both Canonical DDD and Common Patterns, as well as some design choices unique to this framework. 
The **Pedigree** column in the tables below indicates the origin of each concept to avoid confusion.

- Canonical DDD — Defined by Evans/Vernon
- Common Pattern — Widely used, not formal DDD
- Cellix-specific — Cellix design/construct
- Impl detail — Implementation helper

---

### Aggregates & Entities

| Concept (DDD / Cellix) | Seedwork Export                              | Source File         | Pedigree        |
|------------------------|----------------------------------------------|---------------------|-----------------|
| Aggregate Root         | `AggregateRoot<Props, Passport>`             | [aggregate-root.ts](./aggregate-root.ts) | Canonical DDD   |
| Entity                 | `DomainEntity<Props>`                        | [domain-entity.ts](./domain-entity.ts)  | Canonical DDD   |
| Props Shape            | `DomainEntityProps`                          | [domain-entity.ts](./domain-entity.ts)  | Impl detail     |
| Event Registry         | `RootEventRegistry`                          | [aggregate-root.ts](./aggregate-root.ts) | Cellix-specific |
| Embedded Arrays        | `PropArray<EntityProps>`                     | [prop-array.ts](./prop-array.ts)     | Cellix-specific |

- *AggregateRoot*: Base class for aggregate roots (transaction/consistency boundary). Collects domain/integration events; optional `onSave`; supports soft delete via `isDeleted`.
- *DomainEntity*: Base class for entities with identity and behavior.
- *DomainEntityProps*: Required props shape for entities; must include `id: string`.
- *RootEventRegistry*: Type for the aggregate's internal registry for passing down root-level information to embedded entities/value objects.
- *PropArray*: Interface to manage embedded collections by prop shape (`items`, `addItem`, `getNewItem`, `removeItem`, `removeAll`).

**Example: Aggregate raising a domain event**

```ts
class Order extends DomainSeedwork.AggregateRoot<OrderProps, Passport> {
  addItem(item: Item) {
    this.addDomainEvent(new ItemAddedEvent({ itemId: item.id }));
  }
}
```

**Example: Aggregate with embedded array of entities**

```ts
class UserCustomView extends DomainSeedwork.DomainEntity<UserCustomViewProps> {}

interface UserProps extends DomainSeedwork.DomainEntityProps {
    customViews: DomainSeedwork.PropArray<UserCustomViewProps>;
}
class User extends DomainSeedwork.AggregateRoot<UserProps, Passport> {

  public requestNewCustomView(): UserCustomView {
    /* permission check */
    return new UserCustomView(this.props.customViews.getNewItem() /* + any other required constructor params */);
  }
}
```

---

### Value Objects

| Concept (DDD / Cellix) | Seedwork Export      | Source File       | Pedigree      |
|------------------------|----------------------|-------------------|---------------|
| Value Object           | `ValueObject<Props>` | [value-object.ts](./value-object.ts) | Canonical DDD |
| Props Shape            | `ValueObjectProps`   | [value-object.ts](./value-object.ts) | Impl detail   |

- *ValueObject*: Immutable type identified by its values; encapsulates validation/normalization; return new instances on change.
- *ValueObjectProps*: Marker interface for value-object property shapes.

**Example: Email Value Object with validation**

```ts
interface EmailProps extends DomainSeedwork.ValueObjectProps {
  value: string;
}
class Email extends DomainSeedwork.ValueObject<EmailProps> {
  constructor(props: EmailProps) {
    super(props);
    if (!props.value.includes('@')) throw new Error('Invalid email');
  }
}
```

---

### Events & Messaging

| Concept (DDD / Cellix) | Seedwork Export                                    | Source File       | Pedigree       |
|------------------------|----------------------------------------------------|-------------------|----------------|
| Domain Event           | `DomainEvent`                                      | [domain-event.ts](./domain-event.ts) | Canonical DDD  |
| Typed Event            | `CustomDomainEvent<T>`, `CustomDomainEventImpl<T>` | [domain-event.ts](./domain-event.ts) | Common Pattern |
| Event Bus              | `EventBus`                                         | [event-bus.ts](./event-bus.ts)    | Common Pattern |

- *DomainEvent*: Base interface for events produced by aggregates; carries `aggregateId`.
- *CustomDomainEvent* / *CustomDomainEventImpl*: Typed event with `payload`; convenience base for strongly-typed event definitions.
- *EventBus*: Contract to `dispatch(EventClass, payload)` and `register(EventClass, handler)` for event publication and subscription.

**Example: Registering and handling an event**

```ts
// Domain event
interface UserRegisteredProps { userId: string; }
class UserRegisteredEvent extends DomainSeedwork.CustomDomainEventImpl<UserRegisteredProps> {}

// Event bus usage (import instance that implements `EventBus`)
eventBus.register(UserRegisteredEvent, async (payload) => {
  await sendWelcomeEmail(payload.userId);
});

// MongoRepository and MongoUnitOfWork handle dispatching events automatically (see `@cellix/mongoose-seedwork`)
```

---

### Repositories & Units of Work

| Concept (DDD / Cellix) | Seedwork Export                                             | Source File        | Pedigree        |
|------------------------|-------------------------------------------------------------|--------------------|-----------------|
| Repository             | `Repository<T>`                                             | [repository.ts](./repository.ts)    | Canonical DDD   |
| Unit of Work           | `UnitOfWork`, `InitializedUnitOfWork`                       | [unit-of-work.ts](./unit-of-work.ts)  | Common Pattern  |
| Mapper/Adapter         | `TypeConverter<Persistence, DomainProps, Passport, Domain>` | [type-converter.ts](./type-converter.ts) | Common Pattern  |

- *Repository*: Encapsulates data access for interacting with a single aggregate root in the domain, providing read/write methods like `get` and `save`.
- *UnitOfWork* / *InitializedUnitOfWork*: Manages transactional boundaries and coordinates repository operations for a single aggregate root.
- *TypeConverter*: Handles mapping between persistence models and domain objects, keeping aggregates persistence-agnostic.

**Example: Using a repository with Unit of Work**

```ts
// Application Layer
await uow.withTransaction(passport, async (repo) => {
    const order = await repo.get(orderId);
    order.addItem(item);                    // domain logic (AggregateRoot)
    await repo.save(order);                 // triggers persistence + event collection
});                                         // publishes collected events post-commit
```

**Example: Type conversion between persistence and domain**

```ts
const order = converter.toDomain(doc, passport);
const doc = converter.toPersistence(order);
```

---

### Context & Errors

| Concept (DDD / Cellix)  | Seedwork Export              | Source File                        | Pedigree        |
|-------------------------|------------------------------|------------------------------------|-----------------|
| Execution Context Marker| `BaseDomainExecutionContext` | [base-domain-execution-context.ts](./base-domain-execution-context.ts) | Cellix-specific |
| Authorization Error     | `PermissionError`            | [domain-entity.ts](./domain-entity.ts)                 | Common Pattern  |
| Not Found Error         | `NotFoundError`              | [repository.ts](./repository.ts)                    | Common Pattern  |

- *BaseDomainExecutionContext*: Marker you extend for your app’s execution context (e.g., used in Passports).
- *PermissionError*: Throw for authorization failures within domain logic; translate at application boundaries.
- *NotFoundError*: Indicates repository `get` misses; translate to domain-appropriate errors at boundaries.

**Example: Passport validation in aggregate command**

```ts
if (!passport.canEdit(order)) {
  throw new PermissionError('Not allowed');
}
```

---

## Developer Guidance

### Design Intent

- Keep business rules inside aggregates and value objects; keep application services thin.
- Use events to record meaningful domain facts. Keep payloads small and stable.
- Keep mapping concerns (DB ↔ domain) out of aggregates via `TypeConverter`.
- This package defines contracts and base classes only; infrastructure lives in other `@cellix` packages.

---

### Aggregates, Entities, and Value Objects

- Aggregates are the root entities that define consistency boundaries. Use aggregates to enforce invariants and encapsulate business logic.
- Aggregates can be composed of entities and value objects.
- Entities are mutable and have a distinct identity. They encapsulate behavior and can change over time.
- Value objects are immutable and defined by their attributes. They should be treated as first-class citizens and can be used to capture constraints for related properties.

### Event Guidance

- Domain events describe facts within the same bounded context. Integration events are for cross-context/service communication.
- Aggregates collect events via `addDomainEvent` and `addIntegrationEvent` during command handling.
- After successful persistence, the application/infrastructure layer publishes collected events through an `EventBus` implementation.

### Repository and Unit of Work Guidance

- Repositories focus on a single aggregate root type and implement `get`/`save`. Add domain-specific methods as needed (e.g., factory-like `getNewInstance`, specialized loaders).
- Units of Work coordinate transactional boundaries and provide the correctly scoped repository instance to callers.
- In this repo, many UoW interfaces combine both `UnitOfWork` and `InitializedUnitOfWork` for flexible transaction scoping.

### Authorization and Context

- Use domain-specific Passports/Visas to evaluate permissions within aggregate roots.
- Throw `PermissionError` when a rule is violated; translate this error at the application boundary.
