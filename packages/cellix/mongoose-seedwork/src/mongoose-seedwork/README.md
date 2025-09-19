## Mongoose Seedwork: API and Usage Guide

Infrastructure adapters and helpers for using Domain Seedwork with MongoDB/Mongoose. These exports provide concrete, persistence-side implementations and adapters that pair with `@cellix/domain-seedwork` abstractions (Repository, UnitOfWork, TypeConverter, PropArray) without leaking infrastructure into your domain.

Import from the package root to access the `MongooseSeedwork` namespace.

```ts
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
```

This README documents the persistence-side pieces only. Domain concepts are documented in [Domain Seedwork API docs](../../../cellix-domain-seedwork/src/domain-seedwork/README.md).

---

## Mongoose Seedwork API

### Connections & Models

| Concept (DDD / Cellix) | Export                                         | Source File                          |
|------------------------|------------------------------------------------|--------------------------------------|
| Mongoose Context       | `MongooseContextFactory`                       | [`mongo-connection.ts`](./mongo-connection.ts) |
| Mongoose Model Factory | `modelFactory<ModelType>() => (ctx) => Model`  | [`mongo-connection.ts`](./mongo-connection.ts) |
| ObjectId (MongoDB)     | `ObjectId`                                     | [`index.ts`](./index.ts)             |

- *MongooseContextFactory*: Wrapper around a `mongoose.Mongoose` instance passed to `modelFactory` resolvers.
- *modelFactory*: Lazily obtain/register a Model from the initialized context; returns `(ctx) => Model`.
- *ObjectId*: Re-export from `mongodb` for consistent typing and construction across Cellix.

**Example: Creating a model**

```ts
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';

const getUserModel = MongooseSeedwork.modelFactory('User', userSchema);
const UserModel = getUserModel({ service: mongooseInstance });
```

---

### Domain Adapters & Prop Arrays

| Concept (DDD / Cellix) | Export                    | Source File                                  |
|------------------------|--------------------------|----------------------------------------------|
| Domain Adapter Pattern | `MongooseDomainAdapter`  | [`mongo-domain-adapter.ts`](./mongo-domain-adapter.ts) |
| Prop Array (Mongoose)  | `MongoosePropArray`      | [`mongoose-prop-array.ts`](./mongoose-prop-array.ts)   |
| Base Types             | `Base`, `SubdocumentBase`, `NestedPath`, `NestedPathOptions` | [`base.ts`](./base.ts) |

- *MongooseDomainAdapter*: Base adapter mapping a Mongoose document to domain props (implements `DomainEntityProps`), exposing `id`, `createdAt`, `updatedAt`, `schemaVersion`.
- *MongoosePropArray*: Implements the `PropArray` contract for Mongoose `DocumentArray`s; supports `getNewItem`, `addItem`, `removeItem`, `removeAll`, and `items`.
- *Base types* (`Base`, `SubdocumentBase`, `NestedPath`, `NestedPathOptions`): Common Mongoose document shapes and helpers used by adapters and converters.

**Example: Using MongoosePropArray**

```ts
const customViews = new MongooseSeedwork.MongoosePropArray(userDoc.customViews, UserCustomViewAdapter);
const newView = customViews.getNewItem();
```

---

### Repository & Unit of Work

| Concept (DDD / Cellix) | Export                       | Source File                          |
|------------------------|------------------------------|--------------------------------------|
| Repository Base        | `MongoRepositoryBase`        | [`mongo-repository.ts`](./mongo-repository.ts) |
| Unit of Work           | `MongoUnitOfWork`            | [`mongo-unit-of-work.ts`](./mongo-unit-of-work.ts) |
| Initialized UoW        | `getInitializedUnitOfWork()` | [`mongo-unit-of-work.ts`](./mongo-unit-of-work.ts) |
| Type Converter         | `MongoTypeConverter`         | [`mongo-type-converter.ts`](./mongo-type-converter.ts) |

- *MongoRepositoryBase*: Implements the domain `Repository<T>` contract, dispatches domain events pre-commit, and collects integration events for post-commit dispatch.
	- `get`: Loads by id and maps to domain via the converter; throws `NotFoundError` when missing.
	- `save`: Triggers aggregate `onSave`, dispatches domain events, persists via Mongoose, collects integration events.
- *MongoUnitOfWork*: Wraps `mongoose.connection.transaction(...)`, instantiates a scoped repository, and dispatches integration events after commit.
	- `withTransaction`: Executes callback with a scoped repository; integration events are dispatched after commit.
- *getInitializedUnitOfWork*: Returns helpers for executing scoped transactions and by-id operations with a captured passport.
- *MongoTypeConverter*: Adapts between Mongoose docs, domain adapters/props, and aggregate roots.
	- `toDomain`/`toPersistence`: Bridge between Mongoose and domain shapes via adapters.

**Example: UnitOfWork with a repository**

```ts
await uow.withTransaction(passport, async (repo) => {
	const item = await repo.get(id);
	item.doSomething();
	await repo.save(item);
});
```

---

## Developer Guidance

- Keep domains persistence-agnostic. Use these adapters in infrastructure layers only.
- Repositories should remain focused on a single aggregate type. Add custom loaders/factories as needed.
- Use `MongoTypeConverter` to keep mapping concerns out of aggregates and value objects.
- Domain events are dispatched before persistence commit; integration events after commit.

For domain-side concepts and patterns, see [Domain Seedwork API docs](../../../cellix-domain-seedwork/src/domain-seedwork/README.md).