# Cellix TDD Summary

Package: `@cellix/service-blob-storage`

Package path: `packages/cellix/service-blob-storage`

Summary path: `packages/cellix/service-blob-storage/cellix-tdd-summary.md`

## Package framing

`@cellix/service-blob-storage` is a new framework infrastructure package that provides reusable Azure Blob Storage behavior for Cellix applications while keeping Azure SDK details inside the framework boundary.

Intended consumers are application-specific infrastructure adapter packages such as `@ocom/service-blob-storage`, plus bootstrap code that registers the framework service in a Cellix application.

This was greenfield package work for the framework package, plus downstream wiring and adapter work in OCOM packages.

## Consumer usage exploration

Primary consumer flow:

```ts
const frameworkBlobStorage = new ServiceBlobStorage({
	connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
});

await frameworkBlobStorage.startUp();

const uploadUrl = await frameworkBlobStorage.createBlobWriteSasUrl({
	containerName: 'member-assets',
	blobName: 'avatars/member-123.png',
	expiresOn: new Date(Date.now() + 5 * 60_000),
});
```

Application code should not receive that full framework contract directly. Instead, `@ocom/service-blob-storage` adapts it to fit the needs of the application, made available via `ApiContext`.

Success paths that shaped the contract:

- bootstrap startup from a connection string
- direct-to-blob upload URL generation for application-side flows
- read URL generation for controlled blob access
- server-side upload, list, and delete operations for framework-level reuse

Failure and edge cases that shaped the contract:

- missing or malformed connection string credentials for SAS generation
- access before service startup
- shutdown before startup
- optional metadata, tags, and headers on text uploads
- optional prefix filtering for blob listing

## Contract gate summary

Proposed public exports:

- `ServiceBlobStorage`: Cellix infrastructure service that owns Azure Blob SDK startup, SAS generation, and reusable blob operations
- `BlobStorage`: framework-level contract returned by `startUp()` and used by adapters
- `BlobAddress`, `UploadTextBlobRequest`, `ListBlobsRequest`, `BlobListItem`, `CreateBlobSasUrlRequest`, `CreateContainerSasUrlRequest`, `ServiceBlobStorageOptions`: request and response contracts needed for public usage

Primary success-path snippet:

```ts
const uploadUrl = await blobStorage.createBlobWriteSasUrl({
	containerName: 'member-assets',
	blobName: 'avatars/member-123.png',
	expiresOn: new Date(Date.now() + 5 * 60_000),
});
```

Human review was not required before proceeding because the new framework package is additive, the export surface is intentionally small, and no existing downstream consumer contract was being removed or renamed. Human review is still required before release because this establishes the baseline framework contract for future consumers.

## Public contract

Consumers should rely on these observable behaviors:

- `startUp()` creates a Blob service client from the provided connection string and enables later blob operations
- `shutDown()` clears the started state and rejects invalid shutdown-before-startup usage
- `uploadText()` uploads text content with optional HTTP headers, metadata, and tags
- `deleteBlob()` deletes a named blob from a container
- `listBlobs()` returns blob names and absolute blob URLs, optionally filtered by prefix
- `createBlobReadSasUrl()` returns a read-scoped SAS URL for a specific blob
- `createBlobWriteSasUrl()` returns a create/write-scoped SAS URL for a specific blob
- `createContainerListSasUrl()` returns a list-scoped SAS URL for a container

These must remain internal:

- raw Azure SDK client construction details
- connection-string parsing mechanics
- `StorageSharedKeyCredential` handling
- any application-specific container naming or blob-path conventions

## Test plan

Public-contract tests were written through the package root entrypoint in `packages/cellix/service-blob-storage/src/index.test.ts`.

Grouped by export:

- `ServiceBlobStorage`
  - starts up from the connection string and exposes the started client
  - rejects lifecycle misuse before startup
- `uploadText()`
  - uploads text with optional headers, metadata, and tags
- `listBlobs()`
  - lists names and URLs with prefix filtering
- `deleteBlob()`
  - deletes by container and blob name
- SAS creation methods
  - creates read, write, and container-list SAS URLs with the expected permissions

The tests avoid duplicate narrower coverage by exercising the public methods directly rather than testing internal helpers such as connection-string parsing or SAS-token formatting in isolation. No deep imports were used.

## Changes made

Created the greenfield framework package at `packages/cellix/service-blob-storage` with:

- package metadata, TS config, Vitest config, and turbo metadata
- `ServiceBlobStorage` implementation over `@azure/storage-blob`
- public request and response contracts for blob operations and SAS URL creation
- package-scoped tests that mock the Azure SDK rather than using live Azure resources

Updated `@ocom/context-spec`, `apps/api/src/index.ts`, and the acceptance-test mock application-services builder so application context now exposes the scoped OCOM blob-storage contract while bootstrap still registers the framework service.

## Documentation updates

Added `manifest.md` describing the framework package purpose, boundaries, non-goals, and release standards.

Added `README.md` with standalone consumer framing and a root-import usage example.

Added rich TSDoc on the public request types and public service methods so the package contract is documented at the export point.

Added a brief `readme.md` to `@ocom/service-blob-storage` describing the application-specific downscoped contract.

## Release hardening notes

Export-surface review:

- the framework package exports a minimal root-only surface
- Azure SDK clients and credentials do not leak through the public contract
- application code receives only the OCOM adapter contract through `ApiContext`

Compatibility impact:

- semver impact: additive minor-level change for the monorepo because the framework package and context exposure are new surface area
- existing placeholder `@ocom/service-blob-storage` behavior was replaced, but there were no real downstream consumers of that placeholder contract in this repo

Remaining follow-up work:

- migrate actual application flows to consume `blobStorageService` where needed
- decide whether additional framework operations beyond upload/list/delete/SAS generation are required before external release
- review whether GraphQL transport types such as `BlobAuthHeader` should be aligned with the new adapter contract in a separate task

## Validation performed

Ran and verified the following commands and outcomes:

Package build command: `pnpm --filter @cellix/service-blob-storage build` - passed.

Package existing test command: `pnpm --filter @cellix/service-blob-storage test` - passed.

Additional dependent verification:

- `pnpm --filter @ocom/service-blob-storage test` - passed
- `pnpm --filter @ocom/service-blob-storage build` - passed
- `pnpm --filter @ocom/context-spec build` - passed
- `pnpm --filter @apps/api test -- --run src/index.test.ts` - passed
- `pnpm --filter @apps/api build` - passed
- `pnpm install --lockfile-only` - passed
- `CI=true pnpm install` - passed

Wider verification beyond those touched packages was intentionally not run because the change is isolated to the new framework package, the OCOM adapter/context boundary, and bootstrap wiring.

Public behaviors intentionally left unverified:

- no live Azure or Azurite integration tests were run
- no downstream application-service usage migration was added in this task

Additional narrower tests were not retained beyond the public contract suite; package tests stay focused on observable public behavior through root imports.
