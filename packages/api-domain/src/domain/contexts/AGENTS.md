---
applyTo: "packages/api-domain/src/domain/contexts/**/*.aggregate.ts"
---

# Copilot Instructions: Aggregates

See the package-wide and context-specific instructions `packages/api-domain/AGENTS.md` for general rules, architecture, and conventions.

## Purpose
- Aggregate root files define the main entry point for a group of related entities and value objects within a bounded context.
- Aggregate roots enforce business invariants, coordinate changes to related entities/value objects, and encapsulate transactional boundaries.

## Architecture & Patterns
- **Domain-Driven Design (DDD):** Each aggregate root represents a transactional consistency boundary and is responsible for enforcing domain rules.
- **Authorization:** All mutating operations (setters, commands, methods that change state) must enforce authorization using the appropriate Visa for the aggregate's context.
- **Event Sourcing:** Use `addDomainEvent` and `addIntegrationEvent` to raise domain and integration events as needed.
- **Immutability:** Expose immutable references for value objects and entity references where possible.

## Coding Conventions
- Extend `DomainSeedwork.AggregateRoot<Props, Passport>` and implement the corresponding entity reference interface.
- Use TypeScript strict typing and generics for props.
- Use `readonly` for immutable properties.
- Use kebab-case for filename matching the `{aggregate}.aggregate.ts` pattern.
- Export the aggregate root class and related types from the context's `index.ts`.
- Document all public APIs with JSDoc comments. Describe the function's purpose, its parameters, and the output.
- Do not include infrastructure, persistence, or application service code.

## Implementation Guidelines
- Each file should contain a *Props* interface, an *EntityReference* interface, and an *AggregateRoot* class.

### Props
- Each aggregate root must define a *Props* interface that extends `DomainSeedwork.DomainEntityProps`.
- The *Props* interface should include all relevant properties for the aggregate root, using appropriate types.
- *Props* can be optional; denoted by a union type (e.g., `foo: string | undefined`).
- Immutable properties should be marked with `readonly`.
- Prop Types include:
    - primitives: simple TypeScript types (`string`, `boolean`, `Date`, etc.)
    - entities: fields which contain an entity type on that aggregate; uses the entity's *Props* interface (e.g `ExampleEntityProps`). Mark these fields as `readonly`.
    - prop arrays:  fields which contain arrays of an entity type on that aggregate (e.g `DomainSeedwork.PropArray<ExampleEntityProps>`). See `PropArray` from `@cellix/domain-seedwork/` for more details.
    - reference fields: fields which refer to other aggregates (e.g `Readonly<ExampleAggregateEntityReference>`)

### EntityReference
- Each aggregate root must define an *EntityReference* interface that extends its *Props* interface wrapped in `Readonly<>`.
- The *EntityReference* interface serves as the read-only view of the aggregate root's properties.
- The *EntityReference* omits fields that are either: entities, prop arrays, or reference fields.
    - The interface provides readonly replacements for these omitted fields which use that field's *EntityReference* type wrapped in `Readonly<>`.
    - Example: If the aggregate has a field `bar` of type `ExampleEntityProps`, the *EntityReference* will have a `readonly` field `bar` of type `Readonly<ExampleEntityReference>`.

### AggregateRoot
- Each aggregate root must define an *AggregateRoot* class that extends `DomainSeedwork.AggregateRoot<Props, Passport>` and implements the *EntityReference* interface.
    - Note that `Props` here extends the aggregate's *Props* interface.
- Organize your *AggregateRoot* class with the following regions and order:
  1. **Fields**: Private/protected fields, including the Visa instance and any state flags (e.g., `isNew`).
    - The aggregate's Visa type is derived from the aggregate's bounded context in `src/domain/contexts/{context}/{context.visa.ts}`
    - isNew is a private boolean member for tracking the creation state of the aggregate
  2. **Constructors**: Public constructor, initializing props, passport, and Visa.
    - The constructor should accept props and passport, and initialize the Visa using the passport's context.
  3. **Methods**: Static factory creation, can include publicly exposed domain behavior (e.g., `getNewInstance`, `markAsNew`).
    - All aggregates are required to implement a static `getNewInstance` method for creating new instances.
        - This method should return a new instance of the aggregate with the initial required property values.
    - Methods are able to call other methods within the aggregate root, including private methods, to enforce invariants and encapsulate domain behavior.
  6. **Properties (Getters/Setters)**: Expose state, enforce permission checks in setters, and leverage value objects/entities as needed.
    - Getters/Setters match the name of the aggregate's properties, and should adhere to the types defined in the *Props* interface.
    - Setters can include validation logic via `ValueObjects` and permission checks via `Visa`, as well as include domain-specific behavior as needed.
        - All complex property validation must use value objects from `{aggregate}.value-objects.ts`. See value objects instructions below for more information.
        - All permission errors should use a clear, consistent message: `"You do not have permission to update this {property}"`.
    - Immutable properties can omit setters.

### Getters and Setters for Different Field Types

#### Primitive Type Field
```typescript
get requiredProperty(): string {
  return this.props.requiredProperty;
}
set requiredProperty(value: string) {
  // visa permission check
  this.props.requiredProperty = value;
}
```

#### Entity Field
There are no setters for Entity fields; underlying properties are set via setters on the Entity class and accessed by the getter on the class which contains the Entity field property.
```typescript
get exampleEntity(): ExampleEntity {
  return new ExampleEntity(this.props.exampleEntity, this.visa);
}
```

#### Prop Array Field
```typescript
get exampleEntityArray(): ReadonlyArray<ExampleEntityReference> {
  return this.props.exampleEntityArray.items.map(entity => entity as ExampleEntityReference);
}
private requestNewExampleEntity(): ExampleEntity {
  // visa permission check
  const exampleEntityProps = this.props.exampleEntityArray.getNewItem();
  return new ExampleEntity(exampleEntityProps, this.visa);
}
public requestAddExampleEntity(field: string): void {
    // visa permission check
    const exampleEntity = this.requestNewExampleEntity();
    // set required fields on Entity class after adding it to prop array via private method
    exampleEntity.field = field;
}
public removeExampleEntity(entity: ExampleEntityProps): void {
  // visa permission check
  this.props.exampleEntityArray.removeItem(entity);
}
```

#### Reference Field
```typescript
get exampleReference(): ExampleAggregateEntityReference {
  return new ExampleAggregate(this.props.exampleReference, this.passport);
}
set exampleReference(reference: ExampleAggregateEntityReference) {
  // visa permission check
  this.props.exampleReference = reference;
}
```

## Implementation Examples

### Props
Example implementation for a *Props* interface for an aggregate:
```typescript
export interface MyAggregateProps extends DomainSeedwork.DomainEntityProps {
  requiredProperty: string;
  optionalProperty: string | undefined;
  exampleEntity: ExampleEntityProps;
  exampleEntityArray: DomainSeedwork.PropArray<ExampleEntityProps>;
  exampleReference: Readonly<ExampleAggregateEntityReference>;
  readonly createdAt: Date;
  // ...other properties...
}
```

### EntityReference
Example implementation for an *EntityReference* interface for an aggregate:
```typescript
export interface MyAggregateEntityReference extends Readonly<
  Omit<MyAggregateProps, 'exampleEntity' | 'exampleEntityArray' | 'exampleReference'>
> {
    readonly exampleEntity: Readonly<ExampleEntityReference>;
    readonly exampleEntityArray: ReadonlyArray<ExampleEntityReference>;
    readonly exampleReference: Readonly<ExampleAggregateEntityReference>;
}
```

### AggregateRoot
Example implementation for an *AggregateRoot* class:
```typescript
export class MyAggregateRoot<props extends MyAggregateProps> 
    extends DomainSeedwork.AggregateRoot<props, Passport> 
        implements MyAggregateEntityReference {
    //#region Fields
    private isNew: boolean = false;
    private readonly visa: MyVisa;
    //#endregion Fields

    //#region Constructor
    constructor(props: props, passport: Passport) {
        super(props, passport);
        this.visa = passport.context.forAggregate(this);
    }
    //#endregion Constructor

    //#region Methods
    public static getNewInstance<props extends MyProps>(
        newProps: props,
        // required params
        passport: Passport
        ): MyAggregate<props> {
        const aggregate = new MyAggregate(newProps, passport);
        aggregate.markAsNew();
        // set required properties
        aggregate.isNew = false;
        return aggregate;
    }

    private markAsNew(): void {
        this.isNew = true;
        // optionally emit integration event for aggregate creation
        this.addIntegrationEvent(MyAggregateCreatedEvent, {
            // event payload
            aggregateId: this.id
        });
    }
    //#endregion Methods

    //#region Properties
    get requiredProperty(): string {
        return this.props.requiredProperty;
    }
    set requiredProperty(value: string) {
        if (!this.isNew && !this.visa.determineIf(
            permissions => permissions.requiredPermission
        )) {
            throw new DomainSeedwork.PermissionError(
                'You do not have permission to change requiredProperty'
            );
        }
        this.props.requiredProperty = value;
        // optionally emit domain event for a property change
        this.addDomainEvent(MyAggregateRequiredPropertyUpdatedEvent, {
            // event payload
            aggregateId: this.id,
            requiredProperty: this.requiredProperty,
        });
    }
    // Other properties go here...
}
```

### Value Objects
Setters can use *ValueObjects* to provide input validation for their properties. See value objects instructions below for more information.
For example:
```typescript
import * as ValueObjects from './my-aggregate.value-objects.ts';

set requiredProperty(value: string) {
    if (!this.isNew && !this.visa.determineIf(
        permissions => permissions.requiredPermission
    )) {
        throw new DomainSeedwork.PermissionError(
            'You do not have permission to change requiredProperty'
        );
    }
    this.props.requiredProperty = new ValueObjects.RequiredProperty(value).valueOf();
}

```

### Permission Checks
Setters can enforce permission checks on the aggregate's *Visa* as needed.
For example:
```typescript
set someProperty(value: string) {
  if (!this.isNew && !this.visa.determineIf(
    permissions => permissions.requiredPermission // Any predicate using the bounded context's domain permissions can be applied here
  )) {
    throw new DomainSeedwork.PermissionError(
      'You do not have permission to change this property'
    );
  }
  this.props.someProperty = value;
}
```



## Testing
- Unit tests required for all aggregates.
- Each aggregate file must have a corresponding `*.test.ts` file and `./features/*.feature` file.
    - The feature file describes business and permission rules of the aggregate following BDD, which will be enforced by the unit tests.
- Test both positive and negative permission scenarios.
- Test that validation occurs (not exhaustive test cases; handled by value object unit tests)
- Test aggregate creation and valid property mutations.
- Test domain event and integration emission for both positive and negative scenarios.
- Use `vitest` and `@amiceli/vitest-cucumber` for testing.

---
applyTo: "packages/api-domain/src/domain/contexts/**/index.ts"
---

# Copilot Instructions: Contexts

See the package-wide instructions in `packages/api-domain/AGENTS.md` for general rules, architecture, and conventions.

## Purpose
- Context files serve as the entry points for bounded contexts in the Domain-Driven Design architecture.
- Each context encapsulates its respective aggregates, entities, value objects, repositories, and related types.

## Architecture & Patterns
- **Domain-Driven Design (DDD):** Each context represents a separate bounded context with its own ubiquitous language.
- **Barrel Exports:** These files act as barrel export modules, exposing the main types and classes used by the context.

## Coding Conventions
- Use kebab-case for directory matching the `{context}/index.ts` pattern.
- Export relevant aggregate roots, entity props interfaces, entity reference interfaces, value objects, repositories, visas, and passports.
- Group exports by type (aggregates, entities, repositories, etc.).
- Document the context's purpose and domain responsibilities.

## Implementation Guidelines
- Export all public aggregate root classes.
- Export all Props and EntityReference interfaces for aggregates.
- Export repository interfaces from the context.
- Export Visa and Passport types.
- Export custom value objects and related types.

### Export Structure
Organize exports with the following structure:
```typescript
// Core domain types
export * from './user.aggregate';
export * from './user.value-objects';

// Entities (if any)
export * from './entities/profile.entity';

// Repositories
export * from './repositories/user.repository';

// Context-specific types
export * from './user.visa';
export * from './user.passport';
```

## Testing
- Context files typically don't require direct unit testing but should be verified through aggregate and entity tests.
- Integration tests may verify that all exports are properly accessible.

---
applyTo: "packages/api-domain/src/domain/contexts/**/*.entity.ts"
---

# Copilot Instructions: Entities

See the package-wide instructions in `packages/api-domain/AGENTS.md` for general rules, architecture, and conventions.

## Purpose
- Entity files define domain objects that have distinct identities but are not aggregate roots themselves.
- Similar to aggregate roots, entities encapsulate business rules, validate their state through value objects, and enforce permissions through visas.
- Entities are a part of an aggregate's composition. When composed into an aggregate, the aggregate is responsible for lifecycle orchestration and invoking entity mutators explicitly.
- Entities may or may not include an `id` field, depending on if identity is needed (e.g. distinguishing entities within a prop array). For entities that refer to a single document, no `id` field is needed.

## Architecture & Patterns
- **Domain-Driven Design (DDD):** Entities have identity and can change state over time while maintaining their unique identity.
- **Authorization:** All mutating operations must enforce authorization using the appropriate Visa for the entity's context.
- **Value Objects:** Use value objects for complex validation and immutable types.
- **Immutability:** Expose immutable references where possible.

## Coding Conventions
- Extend `DomainSeedwork.Entity<Props>` and implement the corresponding entity reference interface.
- Use TypeScript strict typing and generics for props.
- Use `readonly` for immutable properties.
- Use kebab-case for filename matching the `{entity}.entity.ts` pattern.
- Export the entity class and related types from the context's `index.ts`.
- Document all public APIs with JSDoc comments.
- Do not include infrastructure, persistence, or application service code.

## Implementation Guidelines
- Each file should contain a *Props* interface, an *EntityReference* interface, and an *Entity* class.

### Props
- Each entity must define a *Props* interface that may extend `DomainSeedwork.DomainEntityProps` if the entity requires an id.
- The *Props* interface should include all relevant properties for the entity, using appropriate types.
- *Props* can be optional; denoted by a union type (e.g., `foo: string | undefined`).
- Immutable properties should be marked with `readonly`.

### EntityReference
- Each entity must define an *EntityReference* interface that extends its *Props* interface wrapped in `Readonly<>`.
- The *EntityReference* interface serves as the read-only view of the entity's properties.

### Entity
- Each entity must define an *Entity* class that extends `DomainSeedwork.Entity<Props>` and implements the *EntityReference* interface.
- Organize your *Entity* class with the following regions and order:
  1. **Fields**: Private/protected fields, including the Visa instance.
  2. **Constructors**: Public constructor, initializing props and Visa.
  3. **Methods**: Public domain behavior methods.
  4. **Properties (Getters/Setters)**: Expose state, enforce permission checks in setters.

### Getters and Setters
- Getters/Setters match the name of the entity's properties.
- Setters should include validation logic via `ValueObjects` and permission checks via `Visa`.
- All permission errors should use a clear, consistent message: `"You do not have permission to update this {property}"`.
- Immutable properties can omit setters.

## Implementation Examples

### Props
Example implementation for a *Props* interface for an entity:
```typescript
export interface ProfileEntityProps {
  name: string;
  bio: string | undefined;
  readonly createdAt: Date;
}
```

### EntityReference
Example implementation for an *EntityReference* interface for an entity:
```typescript
export interface ProfileEntityReference extends Readonly<ProfileEntityProps> {}
```

### Entity
Example implementation for an *Entity* class:
```typescript
export class ProfileEntity extends DomainSeedwork.Entity<ProfileEntityProps> 
    implements ProfileEntityReference {
    //#region Fields
    private readonly visa: UserVisa;
    //#endregion Fields

    //#region Constructor
    constructor(props: ProfileEntityProps, visa: UserVisa) {
        super(props);
        this.visa = visa;
    }
    //#endregion Constructor

    //#region Properties
    get name(): string {
        return this.props.name;
    }
    set name(value: string) {
        if (!this.visa.determineIf(permissions => permissions.canUpdateProfile)) {
            throw new DomainSeedwork.PermissionError(
                'You do not have permission to update this name'
            );
        }
        this.props.name = value;
    }

    get bio(): string | undefined {
        return this.props.bio;
    }
    set bio(value: string | undefined) {
        if (!this.visa.determineIf(permissions => permissions.canUpdateProfile)) {
            throw new DomainSeedwork.PermissionError(
                'You do not have permission to update this bio'
            );
        }
        this.props.bio = value;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }
    //#endregion Properties
}
```

## Testing
- Unit tests required for all entities.
- Each entity file must have a corresponding `*.test.ts` file.
- Test both positive and negative permission scenarios.
- Test that validation occurs (not exhaustive test cases; handled by value object unit tests).
- Test entity creation and valid property mutations.
- Use `vitest` for testing.

---
applyTo: "packages/api-domain/src/domain/contexts/**/repositories/*.ts"
---

# Copilot Instructions: Repositories

See the package-wide instructions in `packages/api-domain/AGENTS.md` for general rules, architecture, and conventions.

## Purpose
- Repository files define the interfaces for data access within each bounded context.
- Repositories provide an abstraction layer between the domain layer and the infrastructure layer for data persistence.
- Each aggregate root should have a corresponding repository interface that defines methods for persisting and retrieving that aggregate.

## Architecture & Patterns
- **Domain-Driven Design (DDD):** Repositories are part of the domain layer and define contracts for data access without implementation details.
- **Interface Segregation:** Each repository should focus on a single aggregate root and its related operations.
- **Dependency Inversion:** Domain layer defines interfaces; infrastructure layer implements them.

## Coding Conventions
- Use interface definitions only; no concrete implementations.
- Use kebab-case for filename matching the `{aggregate}.repository.ts` pattern.
- Export repository interfaces from the context's `index.ts`.
- Use TypeScript strict typing and generics.
- Document all methods with JSDoc comments.

## Implementation Guidelines
- Each repository interface should be named `{Aggregate}Repository`.
- Define methods for basic CRUD operations: create, read, update, delete.
- Use aggregate-specific types for method parameters and return types.
- Include query methods as needed for the aggregate's use cases.

### Repository Interface Structure
```typescript
export interface UserRepository {
  /**
   * Saves a user aggregate to persistence
   * @param user The user aggregate to save
   * @returns Promise resolving to the saved user
   */
  save(user: UserAggregate): Promise<UserAggregate>;

  /**
   * Finds a user by their unique identifier
   * @param id The user's unique identifier
   * @returns Promise resolving to the user or undefined if not found
   */
  findById(id: string): Promise<UserAggregate | undefined>;

  /**
   * Finds a user by their email address
   * @param email The user's email address
   * @returns Promise resolving to the user or undefined if not found
   */
  findByEmail(email: string): Promise<UserAggregate | undefined>;

  /**
   * Removes a user from persistence
   * @param id The user's unique identifier
   * @returns Promise resolving when the operation is complete
   */
  delete(id: string): Promise<void>;
}
```

## Method Naming Conventions
- Use `save` for both create and update operations.
- Use `findBy{Property}` for query operations.
- Use `delete` for removal operations.
- Use `exists` for existence checks.
- Use `list` or `findAll` for collection queries.

## Implementation Examples

### Basic Repository
```typescript
export interface PropertyRepository {
  save(property: PropertyAggregate): Promise<PropertyAggregate>;
  findById(id: string): Promise<PropertyAggregate | undefined>;
  findByOwnerId(ownerId: string): Promise<PropertyAggregate[]>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}
```

### Repository with Complex Queries
```typescript
export interface CaseRepository {
  save(case: CaseAggregate): Promise<CaseAggregate>;
  findById(id: string): Promise<CaseAggregate | undefined>;
  findByStatus(status: CaseStatus): Promise<CaseAggregate[]>;
  findByPropertyId(propertyId: string): Promise<CaseAggregate[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<CaseAggregate[]>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}
```

## Testing
- Repository interfaces typically don't require unit testing.
- Integration tests should verify that concrete implementations work correctly.
- Mock implementations may be created for testing other domain services.

---
applyTo: "packages/api-domain/src/domain/contexts/**/*.uow.ts"
---

# Copilot Instructions: Unit of Works

See the package-wide instructions in `packages/api-domain/AGENTS.md` for general rules, architecture, and conventions.

## Purpose
- Unit of Work (UoW) files implement the Unit of Work pattern to manage transactions and coordinate changes across multiple aggregates within a bounded context.
- UoW classes provide a way to ensure consistency and atomicity when working with multiple repositories and aggregates.
- Each bounded context should have its own UoW implementation that coordinates the repositories within that context.

## Architecture & Patterns
- **Unit of Work Pattern:** Maintains a list of objects affected by a business transaction and coordinates writing out changes and resolving concurrency problems.
- **Transaction Management:** Ensures all changes within a business operation succeed or fail together.
- **Repository Coordination:** Provides access to all repositories within the context through a single interface.

## Coding Conventions
- Use kebab-case for filename matching the `{context}.uow.ts` pattern.
- Export UoW interfaces and classes from the context's `index.ts`.
- Use TypeScript strict typing and async/await patterns.
- Document all public methods with JSDoc comments.

## Implementation Guidelines
- Each UoW should provide access to all repositories within its bounded context.
- Implement `begin`, `commit`, and `rollback` methods for transaction management.
- Include a `saveChanges` method that commits all pending changes.
- Provide repository accessor properties.

### UoW Interface Structure
```typescript
export interface UserUnitOfWork {
  /**
   * Gets the user repository
   */
  readonly users: UserRepository;
  
  /**
   * Gets the profile repository (if separate)
   */
  readonly profiles: ProfileRepository;

  /**
   * Begins a new transaction
   */
  begin(): Promise<void>;

  /**
   * Commits all changes in the current transaction
   */
  commit(): Promise<void>;

  /**
   * Rolls back all changes in the current transaction
   */
  rollback(): Promise<void>;

  /**
   * Saves all pending changes
   */
  saveChanges(): Promise<void>;
}
```

### UoW Implementation Structure
```typescript
export class UserUnitOfWorkImpl implements UserUnitOfWork {
  private transaction: any; // Database-specific transaction object
  private isInTransaction: boolean = false;

  constructor(
    public readonly users: UserRepository,
    public readonly profiles: ProfileRepository,
    private readonly transactionManager: any // Database-specific transaction manager
  ) {}

  async begin(): Promise<void> {
    if (this.isInTransaction) {
      throw new Error('Transaction already in progress');
    }
    this.transaction = await this.transactionManager.begin();
    this.isInTransaction = true;
  }

  async commit(): Promise<void> {
    if (!this.isInTransaction) {
      throw new Error('No transaction in progress');
    }
    await this.transaction.commit();
    this.isInTransaction = false;
    this.transaction = null;
  }

  async rollback(): Promise<void> {
    if (!this.isInTransaction) {
      throw new Error('No transaction in progress');
    }
    await this.transaction.rollback();
    this.isInTransaction = false;
    this.transaction = null;
  }

  async saveChanges(): Promise<void> {
    if (this.isInTransaction) {
      await this.commit();
    }
  }
}
```

## Usage Patterns

### Basic Transaction Usage
```typescript
async function createUser(userData: CreateUserData, uow: UserUnitOfWork): Promise<void> {
  try {
    await uow.begin();
    
    const user = UserAggregate.getNewInstance(userData.userProps, passport);
    const profile = ProfileEntity.getNewInstance(userData.profileProps);
    
    await uow.users.save(user);
    await uow.profiles.save(profile);
    
    await uow.commit();
  } catch (error) {
    await uow.rollback();
    throw error;
  }
}
```

### Auto-Transaction Usage
```typescript
async function updateUser(userId: string, updateData: UpdateUserData, uow: UserUnitOfWork): Promise<void> {
  const user = await uow.users.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.updateProfile(updateData);
  
  // saveChanges will automatically handle transaction if not already in one
  await uow.saveChanges();
}
```

## Implementation Examples

### Simple Context UoW
```typescript
export interface PropertyUnitOfWork {
  readonly properties: PropertyRepository;
  
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  saveChanges(): Promise<void>;
}
```

### Complex Context UoW
```typescript
export interface CommunityUnitOfWork {
  readonly communities: CommunityRepository;
  readonly memberships: MembershipRepository;
  readonly activities: ActivityRepository;
  
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  saveChanges(): Promise<void>;
  
  /**
   * Specialized method for complex community operations
   */
  createCommunityWithMembers(
    community: CommunityAggregate, 
    members: MembershipAggregate[]
  ): Promise<void>;
}
```

## Testing
- Unit tests required for UoW implementations.
- Test transaction begin, commit, and rollback behavior.
- Test that rollback properly undoes changes.
- Test repository access through UoW properties.
- Integration tests should verify end-to-end transaction behavior.
- Use `vitest` for testing.

---
applyTo: "packages/api-domain/src/domain/contexts/**/*.value-objects.ts"
---

# Copilot Instructions: Value Objects

See the package-wide instructions in `packages/api-domain/AGENTS.md` for general rules, architecture, and conventions.

## Purpose
- Value object files define immutable objects that encapsulate validation logic and represent domain concepts without identity.
- Value objects ensure data integrity by validating input and throwing descriptive errors for invalid values.
- Each aggregate or entity should have a corresponding value objects file that contains all validation logic for that domain concept.

## Architecture & Patterns
- **Domain-Driven Design (DDD):** Value objects represent concepts that are defined by their attributes rather than identity.
- **Immutability:** Value objects cannot be changed after creation; instead, new instances are created.
- **Validation:** All validation logic should be encapsulated within value objects.
- **Self-Validation:** Value objects validate themselves upon construction.

## Coding Conventions
- Use kebab-case for filename matching the `{aggregate}.value-objects.ts` pattern.
- Export value object classes from the context's `index.ts`.
- Use TypeScript strict typing.
- Extend `DomainSeedwork.ValueObject<T>` where T is the primitive type.
- Document all value objects with JSDoc comments.

## Implementation Guidelines
- Each value object should represent a single domain concept.
- Validation should occur in the constructor.
- Use descriptive error messages that help developers understand what went wrong.
- Implement the `valueOf()` method to return the primitive value.
- Value objects should be immutable.

### Value Object Structure
```typescript
export class EmailAddress extends DomainSeedwork.ValueObject<string> {
  constructor(value: string) {
    super(value);
    this.validate();
  }

  private validate(): void {
    if (!this.value) {
      throw new DomainSeedwork.ValidationError('Email address is required');
    }
    if (!this.isValidEmail(this.value)) {
      throw new DomainSeedwork.ValidationError('Email address format is invalid');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
```

## Validation Guidelines
- Validate required fields first.
- Validate format and constraints second.
- Validate business rules last.
- Use specific error messages that guide the user.
- Include the invalid value in error messages when helpful.

## Implementation Examples

### Simple Value Object
```typescript
export class UserName extends DomainSeedwork.ValueObject<string> {
  constructor(value: string) {
    super(value);
    this.validate();
  }

  private validate(): void {
    if (!this.value) {
      throw new DomainSeedwork.ValidationError('User name is required');
    }
    if (this.value.length < 2) {
      throw new DomainSeedwork.ValidationError('User name must be at least 2 characters long');
    }
    if (this.value.length > 50) {
      throw new DomainSeedwork.ValidationError('User name cannot exceed 50 characters');
    }
    if (!/^[a-zA-Z\s]+$/.test(this.value)) {
      throw new DomainSeedwork.ValidationError('User name can only contain letters and spaces');
    }
  }
}
```

### Complex Value Object with Business Rules
```typescript
export class PropertyAddress extends DomainSeedwork.ValueObject<string> {
  constructor(value: string) {
    super(value);
    this.validate();
  }

  private validate(): void {
    if (!this.value) {
      throw new DomainSeedwork.ValidationError('Property address is required');
    }
    if (this.value.length < 10) {
      throw new DomainSeedwork.ValidationError('Property address must be at least 10 characters long');
    }
    if (this.value.length > 200) {
      throw new DomainSeedwork.ValidationError('Property address cannot exceed 200 characters');
    }
    if (!this.hasValidFormat(this.value)) {
      throw new DomainSeedwork.ValidationError('Property address must include street number, street name, and city');
    }
  }

  private hasValidFormat(address: string): boolean {
    // Business rule: Address must contain numbers (street number) and commas (separating components)
    return /\d/.test(address) && address.includes(',');
  }
}
```

### Numeric Value Object
```typescript
export class RentAmount extends DomainSeedwork.ValueObject<number> {
  constructor(value: number) {
    super(value);
    this.validate();
  }

  private validate(): void {
    if (this.value === null || this.value === undefined) {
      throw new DomainSeedwork.ValidationError('Rent amount is required');
    }
    if (this.value < 0) {
      throw new DomainSeedwork.ValidationError('Rent amount cannot be negative');
    }
    if (this.value > 50000) {
      throw new DomainSeedwork.ValidationError('Rent amount cannot exceed $50,000');
    }
    if (!Number.isInteger(this.value * 100)) {
      throw new DomainSeedwork.ValidationError('Rent amount cannot have more than 2 decimal places');
    }
  }

  /**
   * Formats the rent amount as currency
   */
  toCurrency(): string {
    return `$${this.value.toFixed(2)}`;
  }
}
```

### Composite Value Object
```typescript
export class ContactInfo extends DomainSeedwork.ValueObject<{
  email: string;
  phone: string;
}> {
  constructor(email: string, phone: string) {
    super({ email, phone });
    this.validate();
  }

  private validate(): void {
    new EmailAddress(this.value.email); // Reuse existing value object
    new PhoneNumber(this.value.phone);   // Reuse existing value object
  }

  get email(): string {
    return this.value.email;
  }

  get phone(): string {
    return this.value.phone;
  }
}
```

## Usage in Aggregates and Entities
Value objects should be used in setters to validate input:

```typescript
set email(value: string) {
  if (!this.visa.determineIf(permissions => permissions.canUpdateEmail)) {
    throw new DomainSeedwork.PermissionError('You do not have permission to update this email');
  }
  this.props.email = new EmailAddress(value).valueOf();
}

set rentAmount(value: number) {
  if (!this.visa.determineIf(permissions => permissions.canUpdateRent)) {
    throw new DomainSeedwork.PermissionError('You do not have permission to update this rent amount');
  }
  this.props.rentAmount = new RentAmount(value).valueOf();
}
```

## Testing
- Unit tests required for all value objects.
- Each value object file must have a corresponding `*.test.ts` file.
- Test all validation scenarios: valid values, invalid values, edge cases.
- Test error messages to ensure they are descriptive and helpful.
- Use `vitest` for testing.

### Testing Example
```typescript
describe('EmailAddress', () => {
  test('should accept valid email addresses', () => {
    expect(() => new EmailAddress('user@example.com')).not.toThrow();
    expect(new EmailAddress('user@example.com').valueOf()).toBe('user@example.com');
  });

  test('should reject invalid email addresses', () => {
    expect(() => new EmailAddress('')).toThrow('Email address is required');
    expect(() => new EmailAddress('invalid-email')).toThrow('Email address format is invalid');
    expect(() => new EmailAddress('user@')).toThrow('Email address format is invalid');
  });
});
```