---
sidebar_position: 3
sidebar_label: 0003 Domain Driven Design
description: "Domain Driven Design Decisions."
# These are optional elements. Feel free to remove any of them.
status: accepted
contact: mgupta83
date: 2024-04-18
deciders: gidich, mgupta83
consulted: 
informed: ikeem07, nguyenduy, heruwala
---

# Use DDD Framework to build the data-access project

## Problem Statement
Create a code framework:
- that is easier to maintain and test.
- that can scale and evolve the system over time.
- that aligns with the terminology used by domain experts and users.

## Decision Drivers
- **Reduced Complexity**: DDD breaks down complex business logic into smaller, more manageable pieces (aggregate roots, entities, value objects, etc.).
- **Easier Mocking**: DDD's emphasis on interfaces and abstraction makes it easier to mock dependencies, reducing the complexity of testing.
- **Separation of Concerns**: DDD separate Business Logic from Infrastructure layer, making it easier to test the business logic without worrying about the underlying infrastructure.
- **Ubiquitous Language**: DDD promotes a common shared language between developers, domain experts and users, thereby avoiding ambiguity/confusion in communication.
- **Anti-Corruption Layer**: DDD provides a way to isolate the domain layer from external systems, reducing the impact of changes in external systems on the domain layer.

## Decision
We will implement a DDD framework using the following components:
- **Domain Layer**: This layer will contain the domain models and business logic to manage them.
- **Application Service Layer**: It serves as an intermediary between the user interface and the domain model.
    - coordinates use cases and fulfill application requirements.
    - orchestrates the domain model to execute business logic and retrieve/update data.
    - implements business logic that doesn't naturally fit within the domain model.
    - transaction management and other cross-cutting concerns.
- **Infrastructure Service Layer**: It handles interactions with external systems or services, such as third-party APIs or data stores.
    - facilitates communication and translation between the application and external systems
    - implements anti-corruption layer to translate data and operations between the domain model and external systems using adapters/converters.


## Domain Layer
### Context
It defines the scope of a model and ensures that terms and concepts are consistent within that scope. 
- *Think of it as a microservice boundary, where each microservice has its own domain model and language.*
- **Implementation:** src/app/domain/contexts/*
- **Example:** community

### Entity
An entity is an object within the domain that has a unique identity and is identifiable throughout its lifetime. 
An entity may have attributes and relationships with other entities.
- *Think of it as a real-world object that can be uniquely identified by an Id.*
- **Implementation:** src/app/domain/contexts/**/*.ts [..maybe, add '.entity.ts' extension]
- **Example:** community, role, member, account

#### Entity Props
An interface for attributes or characteristics of an entity. It defines the state of the entity at any given time.

#### Entity Reference
An interface that governs how an entity refers to another entity. It could be a readonly version of the Entity Props interface, allowing the calling entity to access the referred entity's state but not modify it.

### Value Object
Objects that are equal due to the value of their properties, are called value objects. They are immutable and can be shared across entities.
- *Think of it as a compound attribute set where individual attributes don't have any meaning on their own, but together they represent a concept, like price = 5 USD where price is the value object consisting of amount and currency attributes*
- **Implementation:** src/app/domain/contexts/**/*.value-objects.ts
- **Example:** community, account, profile *(Typically, one for each entity, with classes for individual value objects such as address, payment)*
- [@lucaspaganini/value-objects](https://www.npmjs.com/package/@lucaspaganini/value-objects): provides framework to create and validate value objects.

### Aggregate-Root
An entity that acts as a guardian for a group of related entities (known as an aggregate). It is responsible for maintaining the integrity and consistency of the aggregate and for enforcing business rules.
- *Think of it as an entry point to access and manage a group of related entities.*
- **Implementation:** src/app/domain/contexts/**/*.ts [...maybe, add '.aggregate-root.ts' extension]
- **Example:** member (aggregate-root), managing the accounts, custom views, role, etc.

### Unit of Work
It ensures that a set of changes to the domain model are treated as a single, atomic operation. If one part of the operation fails, the entire operation is rolled back, ensuring data consistency. 
- *Think of it as a transaction boundary for data persistence.*
- **Implementation:** src/app/domain/contexts/**/*.uow.ts
- **Example:** : member *(Typically, one for each aggregate-root.)*

### Repository
An abstraction that provides access to the aggregate root, encapsulating the details of data storage and retrieval. Repositories make the system more modular and easier to test.
- *Think of it as an interface that provides CRUD operations for aggregate root, typically a save and multiple purpose-specific get methods.*
- **Implementation:** src/app/domain/contexts/**/*.uow.ts
- **Example:** : member *(Typically, one for each aggregate-root.)*



## Consequences
- We will need to invest time in learning and implementing DDD principles and patterns.
- We will need to ensure that our domain models are correctly defined and separated from the infrastructure.
- We will need to use interface adapters to connect our application layer to our infrastructure layer.


## More Information
- [Domain-Driven Design: Tackling Complexity in the Heart of Software by Eric Evans](https://learning.oreilly.com/library/view/domain-driven-design-tackling/0321125215/)
- [Domain Driven Design - Martin Fowler](https://martinfowler.com/bliki/DomainDrivenDesign.html)