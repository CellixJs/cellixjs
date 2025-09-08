---
sidebar_position: 5
sidebar_label: 0005 Authorization and Access Pattern
description: "Use Passport/Visa Pattern for Authorization and Access for the project."
# These are optional elements. Feel free to remove any of them.
status: accepted
contact: gidich
date: 2024-04-18
deciders: gidich
consulted: etang93, mgupta83
informed: ikeem07, heruwala, nguyenduy
---

# Use Passport/Visa for Access Management

## Context and Problem Statement

The project needs to define the Access Management strategy to ensure that only authorized users have access to the various functionalities.

## Decision Drivers
- **Security Requirements**: Ensure that only an authorized user with a specific role (aggregate of a set of permissions) have access to corresponding functionalities.
- **User Authorization Mechanism**: Determines access to the functionalities based on the user's role, including whether the user can access associated records in a particular state.
- **Member record association**: Define access policies based on how a user's membership is associated with a record.
- **Read/Write Access**: Specify whether a user can read or write to a record.
- **System Permissions**: Define if the system, while performing an operation, can access a record.
- **Domain layer implementation**: The implementation should reside in the domain layer without any dependencies on the infrastructure layer.
- **Auditing and Monitoring**: Define how to audit and monitor user activities within the system.
- **Future Flexibility and Extensibility**: Anticipate future growth and changes in the project's requirements when designing the IAM architecture. Consider factors like support for new authentication mechanisms, scalability, and ease of integration with other services.

## Considered Options
- **Option #1:Use Passport/Visa**: Use Passport/Visa for authorization.

### Terminology:

**Visa**: A visa is issued based on an instance of an aggregate root, as well as the user's membership association, access to the record, system permissions, and domain layer implementation. Visas are granted based on the member's interactions with particular services or features.

**Passport**: A passport is issued to community members upon successful authentication and user accesses any community, serving as the basis for obtaining visa with one or more permissions for specific services or features. 

## Decision Outcome
Chosen option: **Option #1: Use Passport/Visa for Authorization**

The Passport/Visa pattern is a flexible and scalable approach to access management that aligns with the project's requirements. It allows for fine-grained control over user permissions and access to functionalities based on the user's role, membership association, and system permissions. The pattern also ensures that the implementation resides in the domain layer, making it easier to maintain and extend in the future.

## Pros and Cons of the Options
Pros of Passport/Visa:
- **Fine-grained access control**: The Passport/Visa pattern allows for fine-grained control over user permissions and access to functionalities based on the user's role, membership association, and system permissions.
- **Domain layer implementation**: The implementation resides in the domain layer, making it easier to maintain and extend in the future.
- **Scalability and flexibility**: The pattern is flexible and scalable, allowing for easy integration with other services and support for new authentication mechanisms.

Cons of Passport/Visa:
- **Complexity**: The Passport/Visa pattern may introduce additional complexity to the project, especially when defining access policies and permissions for different user roles.

## Links
- [Reference 1](https://example.com)