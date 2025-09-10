---
sidebar_position: 3
sidebar_label: Contexts
description: "Execution contexts within CellixJs framework manage domain-related actions through passport-based security and permissions."
---

# Contexts

Contexts within the CellixJs framework involve multiple levels of abstraction, primarily focusing on the management and execution of domain-related actions. These contexts are part of a security and permissions framework built around the passport pattern and are integrated with the Domain-Driven Design (DDD) architecture.

## Levels of Abstraction

### Domain Execution Context

The Domain Execution Context is the top-level abstraction responsible for executing any action related to the domain. This context utilizes an instance of `Passport` to manage permissions and ensure that actions are carried out within the correct security protocols. It provides access to the domain data source and maintains security boundaries.

```typescript
interface DomainExecutionContext {
    passport: Passport;
    domainDataSource: DomainDataSource;
}
```

### Passport Types

The CellixJs framework implements several passport types for different execution contexts:

#### System Passport

The `SystemPassport` is designed for backend communications and system-level operations, such as publishing messages to a queue or performing administrative tasks where elevated privileges are required. It facilitates operations that are internal to the system, providing necessary permissions to execute system-level tasks.

#### Member Passport

The `MemberPassport` is used for authenticated users operating within a specific community context. This passport type manages permissions based on the user's membership role and community-specific access rights.

#### Staff User Passport

The `StaffUserPassport` provides access control for administrative staff users, deferring to role-based permissions for that specific staff user. This is typically used in administrative portals and back-office operations.

#### Guest Passport

The `GuestPassport` serves as a security layer for operations that should be accessible without authentication, such as viewing public data. It defaults to restrictive permissions, providing read-only access to publicly available information.

## Usage

The passport factory provides convenient methods to create appropriate passport instances based on the execution context:

```typescript
// For guest users (non-authenticated)
const guestPassport = PassportFactory.forGuest();

// For authenticated community members
const memberPassport = PassportFactory.forMember(endUser, member, community);

// For staff users with administrative privileges
const staffPassport = PassportFactory.forStaffUser(staffUser);

// For system-level operations
const systemPassport = PassportFactory.forSystem(permissions);
```

Each passport type provides access to context-specific operations through domain-specific passport interfaces:

- `CommunityPassport` - Community-related operations
- `ServicePassport` - Service management operations  
- `UserPassport` - User-related operations

This design ensures that all domain operations are executed within appropriate security boundaries while maintaining clean separation of concerns across different execution contexts.
