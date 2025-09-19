---
applyTo: "packages/api-domain/src/domain/contexts/**/*.entity.ts"
---

# Copilot Instructions: Entities

See the package-wide instructions in `.github/instructions/api-domain.instructions.md` for general rules, architecture, and conventions.

## Related Instructions
- `.github/instructions/contexts.instructions.md`
- `.github/instructions/aggregates.instructions.md`
- `.github/instructions/value-objects.instructions.md`

## Purpose
- Entity files define domain objects that have distinct identities but are not aggregate roots themselves.
- Similar to aggregate roots, entities encapsulate business rules, validate their state through value objects, and enforce permissions through visas.
- Entities are a part of an aggregate's composition. When composed into an aggregate, the aggregate is responsible for lifecycle orchestration and invoking entity mutators explicitly.
- Entities may or may not include an `id` field, depending on if identity is needed (e.g. distinguishing entities within a prop array). For entities that refer to a single document, no `id` field is needed.

## Architecture & Patterns
- **Domain-Driven Design (DDD):** Each entity represents a distinct domain concept with its own identity and lifecycle.
- **Authorization:** All mutating operations must enforce authorization using the appropriate Visa (either passed directly or from parent aggregate).
- **Value Object Validation:** Use value objects to validate and enforce invariants on entity properties.
- **Immutability:** Expose immutable references and mark appropriate properties as readonly.

## Implementation Guidelines
Entity files must implement the following interfaces and class structure:
- *Props* interface
- *EntityReference* interface
- *Entity* class

Entity implementation is similar to aggregate root implementation. See `.github/instructions/aggregates.instructions.md` for detailed guidance on implementing:
- Props interface
- EntityReference interface
- Class structure and regions (Fields, Constructors, Methods, Properties)
- Permission checks and validation patterns

Key differences from aggregate root implementation:
- Extend `DomainSeedwork.DomainEntity<Props>` for entities that appear in prop arrays
- Extend `DomainSeedwork.ValueObject<Props>` for entities that are singular nested properties
- Constructor receives `visa` instead of `passport` and assigns it directly to a private member
- Entities do not require a static `getNewInstance` method
- Otherwise follow the same patterns as aggregate roots

## Implementation Examples

### Props
Example implementation for a *Props* interface for an entity:
```typescript
export interface MyEntityProps extends DomainSeedwork.DomainEntityProps {
  name: string;
  email: string;
  nestedEntity: NestedEntityProps;
  entityArray: DomainSeedwork.PropArray<EntityItemProps>;
  readonly createdAt: Date;
  // ...other properties
}
```

### EntityReference
Example implementation for an *EntityReference* interface for an entity:
```typescript
export interface MyEntityEntityReference extends Readonly<
  Omit<MyEntityProps, 'nestedEntity' | 'entityArray'>
> {
  readonly nestedEntity: Readonly<NestedEntityReference>;
  readonly entityArray: ReadonlyArray<EntityItemReference>;
}
```

### Entity Class
Example implementation of an entity class:
```typescript
import { DomainSeedwork } from '@cellix/domain-seedwork';
import * as ValueObjects from './example.value-objects.ts';
import type { ExampleVisa } from '../example.visa.ts';

export class MyEntity
  extends DomainSeedwork.DomainEntity<MyEntityProps>
  implements MyEntityEntityReference
{
  //#region Fields
  private isNew: boolean = false;
  private readonly visa: MyAggregateVisa; // Replace MyAggregateVisa with the actual visa used by the aggregate this entity belongs to.
  //#endregion Fields

  //#region Constructors
  constructor(props: MyEntityProps, visa: MyAggregateVisa) {
    super(props);
    this.visa = visa;
  }
  //#endregion Constructors

  //#region Methods
  //#endregion Methods

  //#region Properties
  get name(): string {
    return this.props.name;
  }
  set name(name: string) {
    if (!this.isNew && !this.visa.determineIf(
      permissions => permissions.canEditExample
    )) {
      throw new DomainSeedwork.PermissionError(
        'You do not have permission to change the name'
      );
    }
    this.props.name = new ValueObjects.Name(name).valueOf();
  }

  get email(): string {
    return this.props.email;
  }
  set email(email: string) {
    if (!this.isNew && !this.visa.determineIf(
      permissions => permissions.canEditExample
    )) {
      throw new DomainSeedwork.PermissionError(
        'You do not have permission to change the email'
      );
    }
    this.props.email = new ValueObjects.Email(email).valueOf();
  }
  //#endregion Properties
}
```

### Value Objects
Example of using value objects in setters for validation:
```typescript
import * as ValueObjects from './example.value-objects.ts';

set email(email: string) {
  if (!this.isNew && !this.visa.determineIf(
    permissions => permissions.canEditExample
  )) {
    throw new DomainSeedwork.PermissionError(
      'You do not have permission to change the email'
    );
  }
  this.props.email = new ValueObjects.Email(email).valueOf();
}
```

### Permission Checks
Example of permission checks in setters:
```typescript
set someProperty(value: string) {
  if (!this.isNew && !this.visa.determineIf(
    permissions => permissions.requiredPermission
  )) {
    throw new DomainSeedwork.PermissionError(
      'You do not have permission to change this property'
    );
  }
  this.props.someProperty = value;
}
```

## Testing
- Unit tests required for all entities.
- Each entity file must have a corresponding `*.test.ts` file and `./features/*.feature` file.
- Test both positive and negative permission scenarios.
- Test that validation occurs (not exhaustive test cases; handled by value object unit tests)
- Test entity creation and valid property mutations.
- Test entity usage through aggregate test cases where applicable (e.g., lifecycle orchestration, entity list mutations). Use direct unit tests to validate entity behavior in isolation.
- Use `vitest` and `@amiceli/vitest-cucumber` for testing.

## References
- [DDD Patterns (Evans, Fowler)](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [CellixJS DDD ADR](../../../../docusaurus/decisions/0003-domain-driven-design.md)
