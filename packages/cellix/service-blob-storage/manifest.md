# @cellix/service-blob-storage Manifest

## Purpose

`@cellix/service-blob-storage` provides reusable Azure Blob Storage infrastructure services for Cellix applications. It centralizes Azure SDK usage, lifecycle management, server-side blob operations, and optional client-signing behavior behind a small framework-owned contract.

## Scope

- Managed-identity startup and shutdown for server-side Azure Blob access
- General blob operations that are stable and reusable across applications
- Shared-key read SAS token creation and blob-scoped authorization header creation through a dedicated client-signing service
- Container/blob addressing and request typing that stays framework-level rather than app-specific

## Non-goals

- Application-specific container naming rules or blob path conventions
- GraphQL-specific response models or transport DTOs
- Exposing raw Azure SDK clients or credentials to application code
- Encoding OwnerCommunity-specific permissions or workflows into the framework package
- Supporting connection-string bootstrap on the base service

## Public API shape

- The supported public API is the package root import: `@cellix/service-blob-storage`
- Public exports are limited to two service classes plus framework-level request and response contracts needed by consumers and adapters
- Azure SDK implementation details stay internal even though the package depends on `@azure/storage-blob`
- Public request/response types are exported from the package root. Import types from the package entrypoint rather than internal file paths.

## Core concepts

- `ServiceBlobStorage` is a Cellix infrastructure service implementing `ServiceBase`
- `ServiceBlobStorage` is managed-identity-only for server-side blob operations
- `ServiceClientBlobStorage` extends `ServiceBlobStorage` and adds SharedKey signing through `signingConnectionString`
- `ServiceClientBlobStorage` may also use that required signing connection string to target local emulator endpoints such as Azurite
- Consumers interact with framework-defined operations such as text upload, blob deletion, blob listing, read SAS token creation, and authorization-header creation
- Application packages should expose narrower scoped interfaces before surfacing either service through `ApiContext`

## Package boundaries

- This package owns Azure Blob SDK integration and client construction
- This package owns reusable direct-upload signing behavior because it is storage-implementation-specific rather than app-specific
- This package does not own application context exposure, container naming policies, or handler wiring
- Downstream packages such as `@ocom/service-blob-storage` should define narrowed contracts for application code, not reimplement blob-signing behavior

## Dependencies / relationships

- Depends on `@cellix/api-services-spec` for Cellix infrastructure lifecycle conventions
- Depends on `@azure/storage-blob` for Blob Storage client and SAS support
- Intended to be wrapped by application-specific infrastructure adapter packages

## Testing strategy

- Validate observable behavior through the package root entrypoint only
- Keep public-contract coverage in `tests/` so it mirrors the consumer-facing package surface
- Mock the Azure Blob SDK so tests do not require live Azure resources
- Cover the managed-identity base service and the client-signing subclass separately through public methods

## Documentation obligations

- Keep `README.md` consumer-facing and focused on the exported service contract
- Keep TSDoc aligned with the public request and response types and both service classes
- Update this manifest when the public surface or package boundary changes

## Release-readiness standards

- Public exports stay intentionally small and documented
- Azure SDK clients and credentials do not leak through the public contract
- Managed-identity blob operations and SharedKey signing are covered by package-scoped contract tests, including Azurite integration for the client-signing service
- Shared-key signing remains isolated to `ServiceClientBlobStorage`
