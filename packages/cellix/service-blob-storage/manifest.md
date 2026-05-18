# @cellix/service-blob-storage Manifest

## Purpose

`@cellix/service-blob-storage` provides a reusable Azure Blob Storage infrastructure service for Cellix applications. It centralizes Azure SDK usage, lifecycle management, and blob operations behind a small framework-level contract that application packages can adapt into narrower consumer-facing interfaces.

## Scope

- Azure Blob Storage lifecycle startup and shutdown for Cellix infrastructure bootstraps
- General blob operations that are stable and reusable across applications
- SAS URL creation for scoped blob access without exposing Azure SDK clients to consumers
- Container/blob addressing and request typing that stays framework-level rather than app-specific

## Non-goals

- Application-specific container naming rules or blob path conventions
- GraphQL-specific response models or transport DTOs
- Exposing raw Azure SDK clients or credentials to application code
- Encoding OwnerCommunity-specific permissions or workflows into the framework package

## Public API shape

- The supported public API is the package root import: `@cellix/service-blob-storage`
- Public exports are limited to the service class plus request/response contracts needed by consumers and adapters
- Azure SDK implementation details stay internal even though the package depends on `@azure/storage-blob`
- Public request/response types are exported from the package root (declared internally in src/interfaces.ts). Import types from the package entrypoint rather than internal file paths.

## Core concepts

- `ServiceBlobStorage` is a Cellix infrastructure service implementing `ServiceBase`
- The service supports multiple authentication modes:
  - **Managed identity mode**: Use only `accountName` and `DefaultAzureCredential` (recommended for production)
  - **Connection string mode**: Use `connectionString` for local development (Azurite) or explicit shared-key auth
- Consumers interact with framework-defined operations such as text upload, blob deletion, blob listing, and SAS URL creation
- Application packages should adapt this framework contract into narrower scoped interfaces before exposing it through `ApiContext`
- **Downstream adapters** can choose which auth mode to use. For example, `@ocom/service-blob-storage` uses managed identity for SDK operations and provides connection string separately for SAS token generation (opt-in for client uploads)

## Package boundaries

- This package owns Azure Blob SDK integration and credential parsing
- This package does not own application-specific contracts, context exposure, or handler wiring
- Any consumer-specific wrapper belongs in downstream packages such as `@ocom/service-blob-storage`

## Dependencies / relationships

- Depends on `@cellix/api-services-spec` for Cellix infrastructure lifecycle conventions
- Depends on `@azure/storage-blob` for Blob Storage client and SAS support
- Intended to be wrapped by application-specific infrastructure adapter packages

## Testing strategy

- Validate observable behavior through the package root entrypoint only
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
- Application-specific adapters remain outside this package
