

# Domain Events


## Domain Events and Integration Events


### In-Process Domain Events and Transactions:

In-Process Domain Events are in-process and executed in the same transactional scope as the Aggregate root. If an exception is thrown when processing a domain event, the Aggregate root is rolled back. 

### Integration Domain Events and Transactions:

Integration Domain Events are fired asynchronously and executed in a separate transactional scope. If an exception is thrown when processing a domain event, the Aggregate root is _not_ rolled back. If any integration event fails, it does not impact processing of other integration event handlers.

## Resources:

* [Domain Events vs Integration Events](https://devblogs.microsoft.com/cesardelatorre/domain-events-vs-integration-events-in-domain-driven-design-and-microservices-architectures/) - Cesar de la Torre (Microsoft)
* [DomainEvents Design and Implementation](https://docs.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation#domain-events-versus-integration-events) - Microsoft

Other Notes:

- This project relies on MongoDB as the data-store - which supports embedded data models - and all tightly related data in the model is by default in the same transaction: [MongoDB Docs](https://docs.mongodb.com/manual/core/data-model-design/#std-label-data-modeling-embedding) 
- While more recent versions of MongoDB support multi-document transactions, this project is built on CosmosDB acting as MongoDB and does not support multi-document transactions at the moment.