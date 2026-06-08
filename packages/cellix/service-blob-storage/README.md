# `@cellix/service-blob-storage`

Framework Azure Blob Storage service for Cellix applications.

`@cellix/service-blob-storage` provides the public `BlobStorage` contract and the `ServiceBlobStorage` implementation. It owns Azure SDK client setup, blob upload/list/delete operations, and optional shared-key signing for direct client access.

Use this package when application code should depend on a narrow storage abstraction instead of raw Azure SDK clients.

## Authentication modes

`ServiceBlobStorage` uses managed identity for server-side blob operations by default:

- `accountName` with an optional `credential` for managed identity or other token credential flows

When `AZURE_STORAGE_CONNECTION_STRING` points at a local Azurite endpoint, the service automatically uses that connection string for the blob SDK client so local development keeps working without changing the public constructor contract.

You can also provide `signingConnectionString` to enable direct client signing while keeping server-side blob access on managed identity.

Use:

- `accountName` when the app runs on Azure and should use managed identity for server-side access
- `signingConnectionString` only when the app also needs direct client upload or download signatures

## Typical usage

```ts
import { ServiceBlobStorage } from '@cellix/service-blob-storage';

const blobStorage = new ServiceBlobStorage({
	accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME!,
	signingConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
});

await blobStorage.startUp();

await blobStorage.uploadText({
	containerName: 'member-assets',
	blobName: 'avatars/member-123.json',
	text: '{"id":"member-123"}',
});
```

For direct client flows, use the signing APIs on the started service:

- `generateReadSasToken()`
- `createBlobWriteAuthorizationHeader()`
- `createBlobReadAuthorizationHeader()`

Common patterns:

- server-side upload or cleanup: `uploadText()`, `listBlobs()`, `deleteBlob()`
- read-only client access: `generateReadSasToken()`
- direct browser or mobile upload: `createBlobWriteAuthorizationHeader()`
- direct browser or mobile download: `createBlobReadAuthorizationHeader()`

## Public exports

Import from the package root only:

- `ServiceBlobStorage`
- `type ServiceBlobStorageOptions`
- `type BlobStorage`
- `type BlobAddress`
- `type UploadTextBlobRequest`
- `type ListBlobsRequest`
- `type BlobListItem`
- `type CreateBlobSasUrlRequest`
- `type CreateBlobAuthorizationHeaderRequest`
- `type BlobUploadAuthorizationHeader`

## Notes

- Call `startUp()` before using blob operations.
- Call `shutDown()` during teardown; it is idempotent.
- Shared-key signing is opt-in and must be configured explicitly.
