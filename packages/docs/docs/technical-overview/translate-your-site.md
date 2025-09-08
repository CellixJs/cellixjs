---
sidebar_position: 2
sidebar_label: Domain Driven Design
description: "CellixJs is a Domain-Driven Design (DDD) platform built on Azure Functions with modular architecture and strict separation of concerns."
---

# Domain Driven Design
CellixJs is a modern platform built around the principles of Domain-Driven Design (DDD), a software development methodology that focuses on the core domain and logic of a business. The platform leverages Azure Functions and implements a modular architecture with strict separation of concerns.

The domain is complex, with many interconnected concepts and relationships. By using DDD, we can model this domain in a way that is both understandable and maintainable. This allows us to build a platform that is flexible, scalable, and easy to extend.

## Ubiquitous Language

One of the key concepts of DDD is the use of a Ubiquitous Language. This is a shared language that is used by all members of the development team, as well as stakeholders in the business. The Ubiquitous Language is used to describe the core concepts of the domain, and ensures that everyone has a common understanding of the business logic.

### Contexts

The CellixJs platform is divided into several contexts, each of which represents a different aspect of the domain. These contexts are defined by the core concepts of the domain, and are used to organize the codebase and ensure that each part of the platform is focused on a specific area of functionality.

- Community
   - [GitHub][community-context]
- IAM (Identity and Access Management)
   - [GitHub][iam-context]
- Property 
   - [GitHub][property-context]
- Service 
   - [GitHub][service-context]
- User 
   - [GitHub][user-context]
- Case
   - [GitHub][case-context]


[community-context]: https://github.com/CellixJs/cellixjs/tree/main/packages/api-domain/src/domain/contexts/community
[iam-context]: https://github.com/CellixJs/cellixjs/tree/main/packages/api-domain/src/domain/iam
[property-context]: https://github.com/CellixJs/cellixjs/tree/main/packages/api-domain/src/domain/contexts/property
[service-context]: https://github.com/CellixJs/cellixjs/tree/main/packages/api-domain/src/domain/contexts/service
[user-context]: https://github.com/CellixJs/cellixjs/tree/main/packages/api-domain/src/domain/contexts/user
[case-context]: https://github.com/CellixJs/cellixjs/tree/main/packages/api-domain/src/domain/contexts/case 