# @cellix/service-blob-storage Manifest

## Purpose

`@cellix/service-blob-storage` provides a reusable Azure Blob Storage infrastructure service for Cellix applications. It centralizes Azure SDK usage, lifecycle management, blob operations, and framework-native signing behavior behind a small contract that application packages can adapt into narrower consumer-facing interfaces.

## Scope

- Azure Blob Storage lifecycle startup and shutdown for Cellix infrastructure bootstraps
- General blob operations that are stable and reusable across applications
- Shared-key read SAS token creation and blob-scoped authorization header creation without exposing Azure SDK clients to consumers
- Container/blob addressing and request typing that stays framework-level rather than app-specific

## Non-goals

- Application-specific container naming rules or blob path conventions
- GraphQL-specific response models or transport DTOs
- Exposing raw Azure SDK clients or credentials to application code
- Encoding OwnerCommunity-specific permissions or workflows into the framework package

## Public API shape

- The supported public API is the package root import: `@cellix/service-blob-storage`
- Public exports are limited to the service class plus framework-level request and response contracts needed by consumers and adapters
- Azure SDK implementation details stay internal even though the package depends on `@azure/storage-blob`
- Public request/response types are exported from the package root (declared internally in src/interfaces.ts). Import types from the package entrypoint rather than internal file paths.

## Core concepts

- `ServiceBlobStorage` is a Cellix infrastructure service implementing `ServiceBase`
- The service separates two configuration concerns:
  - **Blob SDK authentication**:
    - `accountName` for managed identity / token credential flows
    - `connectionString` for shared-key / Azurite flows
  - **Optional shared-key signing capability**:
    - `signingConnectionString` enables direct-upload signing and read SAS generation without changing blob SDK auth mode
- Consumers interact with framework-defined operations such as text upload, blob deletion, blob listing, read SAS token creation, and authorization-header creation
- Application packages should expose narrower scoped interfaces before surfacing the service through `ApiContext`
- The same framework service class can be registered multiple times under different semantic names with different option sets

## Package boundaries

- This package owns Azure Blob SDK integration and credential parsing
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
- Mock the Azure Blob SDK so tests do not require live Azure or Azurite resources
- Cover startup, upload, list, delete, and SAS generation through public methods

## Documentation obligations

- Keep `README.md` consumer-facing and focused on the exported service contract
- Keep TSDoc aligned with the public request and response types
- Update this manifest when the public surface or package boundary changes

## Release-readiness standards

- Public exports stay intentionally small and documented
- No raw Azure SDK clients are leaked through the framework contract
- SAS generation and blob operations are covered by package-scoped contract tests
- Shared-key signing remains optional and explicitly configured
