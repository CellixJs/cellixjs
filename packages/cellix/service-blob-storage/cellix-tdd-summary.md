# Cellix TDD Summary

Package: `@cellix/service-blob-storage`

Package path: `packages/cellix/service-blob-storage`

Summary path: `packages/cellix/service-blob-storage/cellix-tdd-summary.md`

## Package framing

`@cellix/service-blob-storage` is an existing framework infrastructure package for Azure Blob Storage. This task is a public-contract refactor and API-surface reduction: the base service now covers only managed-identity-backed server-side blob operations, while client-signing behavior moves to a dedicated subclass.

Intended consumers remain application-specific adapter packages such as `@ocom/service-blob-storage`, plus bootstrap code that registers framework services in a Cellix application.

## Consumer usage exploration

The key downstream consumer split is:

```ts
const blobStorage = new ServiceBlobStorage({
	accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME!,
});

const clientBlobStorage = new ServiceClientBlobStorage({
	accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME!,
	signingConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING!,
});
```

Consumer goals that shaped the contract:

- backend blob operations should depend only on managed identity plus account name
- client upload/download signing should be explicitly opt-in and isolated
- application adapters should expose narrow views instead of the full framework class

Failure and edge cases that shaped the contract:

- `ServiceBlobStorage` must reject connection-string-style configuration at compile time
- `ServiceClientBlobStorage` must require `signingConnectionString`
- access before startup should still fail clearly
- upload/list/delete behavior must remain stable on the base service

## Contract gate summary

Proposed public exports:

- `ServiceBlobStorage`: managed-identity-only framework service for server-side blob operations
- `ServiceClientBlobStorage`: framework subclass that adds SharedKey signing and read SAS creation
- `BlobStorage`: base contract for upload/list/delete operations
- `ClientBlobStorage`: extended contract for signing-capable flows
- `BlobAddress`, `UploadTextBlobRequest`, `ListBlobsRequest`, `BlobListItem`, `CreateBlobSasUrlRequest`, `CreateBlobAuthorizationHeaderRequest`, `BlobUploadAuthorizationHeader`, `ServiceBlobStorageOptions`, `ServiceClientBlobStorageOptions`: public request/response/config contracts needed by consumers

Primary success-path snippet:

```ts
const auth = await clientBlobStorage.createBlobWriteAuthorizationHeader({
	containerName: 'member-assets',
	blobName: 'avatars/member-123.png',
	contentLength: 102400,
	contentType: 'image/png',
});
```

Human review was warranted conceptually because this is a breaking public-contract change with downstream dependents. The user explicitly requested the split and the dependent updates in the same task, so implementation proceeded with the break handled end-to-end in-repo.

## Public contract

Consumers should rely on these observable behaviors:

- `ServiceBlobStorage.startUp()` creates a managed-identity Blob service client from `accountName`
- `ServiceBlobStorage` exposes `uploadText()`, `listBlobs()`, and `deleteBlob()` only
- `ServiceClientBlobStorage.startUp()` starts the same managed-identity blob client and separately enables SharedKey signing from `signingConnectionString`
- `ServiceClientBlobStorage.generateReadSasToken()` returns a read-scoped SAS query string for a specific blob
- `ServiceClientBlobStorage.createBlobWriteAuthorizationHeader()` returns signed write-request headers for direct client uploads
- `ServiceClientBlobStorage.createBlobReadAuthorizationHeader()` returns signed read-request headers for direct client downloads

These must remain internal:

- raw Azure SDK client construction details
- connection-string parsing mechanics
- `StorageSharedKeyCredential` handling
- any application-specific container naming or blob-path conventions

## Test plan

Public-contract tests are written through the package root entrypoint in `packages/cellix/service-blob-storage/tests/index.test.ts`.

Grouped by export:

- `ServiceBlobStorage`
  - starts managed-identity blob access from the account blob endpoint
  - uploads text with optional headers, metadata, and tags
  - lists names and URLs with prefix filtering
  - deletes by container and blob name
  - guards lifecycle misuse before startup
- `ServiceClientBlobStorage`
  - generates read SAS tokens
  - creates write/read authorization headers
  - keeps the blob client on the managed-identity endpoint
- constructor type contract
  - `ServiceBlobStorage` rejects `signingConnectionString`
  - `ServiceClientBlobStorage` requires `signingConnectionString`

Duplicate narrower coverage was avoided by testing the public methods directly rather than re-testing internal helper parsing in isolation. The only narrower contract check added beyond runtime behavior is the constructor type-surface assertion because the new requirement is explicitly compile-time.

## Changes made

- Split `ServiceBlobStorage` into a managed-identity-only base class and a new `ServiceClientBlobStorage` subclass
- Narrowed `ServiceBlobStorageOptions` to `accountName` plus optional `credential`
- Added `ServiceClientBlobStorageOptions`
- Split the public interfaces into `BlobStorage` and `ClientBlobStorage`
- Removed connection-string bootstrap behavior from the base service
- Updated `@ocom/service-blob-storage` to re-export both framework classes and keep narrow backend/client contracts
- Updated `apps/api` bootstrap to register `ServiceBlobStorage` for backend operations and `ServiceClientBlobStorage` for client signing
- Updated `@ocom/context-spec` descriptions to match the split registration

## Documentation updates

- Updated `packages/cellix/service-blob-storage/README.md`
- Updated `packages/cellix/service-blob-storage/manifest.md`
- Added/updated TSDoc on `ServiceBlobStorage`, `ServiceClientBlobStorage`, and their option types
- Updated `packages/ocom/service-blob-storage/readme.md`
- Updated this `cellix-tdd-summary.md` to reflect the new public contract

## Release hardening notes

- Semver impact: breaking. `ServiceBlobStorage` no longer accepts `signingConnectionString` and no longer exposes the client-signing methods.
- Export-surface review: the root package export is intentionally limited to `ServiceBlobStorage`, `ServiceClientBlobStorage`, and the public request/response/config contracts; connection-string parsing helpers and signer internals remain private.
- Downstream impact handled in-repo:
  - `@ocom/service-blob-storage`
  - `@ocom/context-spec`
  - `apps/api`
- Remaining release risk: `ServiceClientBlobStorage` now owns the emulator path as well as SharedKey signing. That keeps all tests passing, but it means local-emulator compatibility is intentionally scoped to the client-signing subclass rather than the managed-identity base class.

## Validation performed

Validated and re-ran the framework package build/test loop plus the directly affected downstream adapter and API bootstrap packages after the contract split.

- Package build command:
  `pnpm --filter @cellix/service-blob-storage build` - passed
- Package existing test command:
  `pnpm --filter @cellix/service-blob-storage test` - passed
- Package integration test command:
  `pnpm --filter @cellix/service-blob-storage test:integration` - passed
- Additional dependent verification:
  `pnpm --filter @ocom/service-blob-storage test` - passed
  `pnpm --filter @ocom/service-blob-storage build` - passed
  `pnpm --filter @ocom/context-spec build` - passed
  `pnpm --filter @apps/api test` - passed
  `pnpm --filter @apps/api build` - passed
