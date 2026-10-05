# `@cellix/service-blob-storage`

Framework Azure Blob Storage services for Cellix applications.

`@cellix/service-blob-storage` exports two framework classes:

- `ServiceBlobStorage`
  - managed-identity-backed server-side blob operations only
- `ServiceClientBlobStorage`
  - the same server-side blob operations plus SharedKey signing for direct client uploads and downloads

Use this package when application code should depend on a Cellix-owned blob abstraction instead of raw Azure SDK clients.

Choose `ServiceBlobStorage` when you only need backend blob I/O.
Choose `ServiceClientBlobStorage` when the same application also needs to sign direct client upload or download requests.

## Service split

`ServiceBlobStorage` is intentionally narrow:

- requires `accountName`
- optionally accepts a `TokenCredential`
- does not accept any connection string configuration
- provides `uploadText()`, `uploadFile()`, `downloadToFile()`, `listBlobs()`, and `deleteBlob()`

`ServiceClientBlobStorage` extends `ServiceBlobStorage`:

- still uses managed identity for the Azure Blob client
- additionally requires `signingConnectionString`
- provides `generateReadSasToken()`
- provides `createBlobWriteAuthorizationHeader()`
- provides `createBlobReadAuthorizationHeader()`

## Usage

```ts
import { ServiceBlobStorage, ServiceClientBlobStorage } from '@cellix/service-blob-storage';

const blobStorage = new ServiceBlobStorage({
	accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME!,
});

const clientBlobStorage = new ServiceClientBlobStorage({
	accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME!,
	signingConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING!,
});

await blobStorage.startUp();
await clientBlobStorage.startUp();
```

Server-side blob operations:

```ts
await blobStorage.uploadText({
	containerName: 'member-assets',
	blobName: 'avatars/member-123.json',
	text: '{"id":"member-123"}',
});
```

Server-side file transfers (Node.js only), for binary content such as encoded media:

```ts
await blobStorage.downloadToFile({
	containerName: 'uploads',
	blobName: 'raw/abc123.mov',
	filePath: '/tmp/encode-abc123/source',
});

await blobStorage.uploadFile({
	containerName: 'videos',
	blobName: 'abc123/manifest.mpd',
	filePath: '/tmp/encode-abc123/out/manifest.mpd',
	httpHeaders: { blobContentType: 'application/dash+xml' },
});
```

Files are streamed, so large media is not buffered in memory. Both methods accept an optional `abortSignal`. `downloadToFile()` rejects with the Azure `RestError` (`statusCode: 404`) when the blob does not exist.

Direct client-signing flow:

```ts
const auth = await clientBlobStorage.createBlobWriteAuthorizationHeader({
	containerName: 'member-assets',
	blobName: 'avatars/member-123.png',
	contentLength: 1024,
	contentType: 'image/png',
});
```

## Public exports

Import from the package root only:

- `ServiceBlobStorage`
- `type ServiceBlobStorageOptions`
- `ServiceClientBlobStorage`
- `type ServiceClientBlobStorageOptions`
- `type BlobStorage`
- `type ClientBlobStorage`
- `type BlobAddress`
- `type UploadTextBlobRequest`
- `type UploadFileBlobRequest`
- `type DownloadBlobToFileRequest`
- `type ListBlobsRequest`
- `type BlobListItem`
- `type CreateBlobSasUrlRequest`
- `type CreateBlobAuthorizationHeaderRequest`
- `type BlobUploadAuthorizationHeader`

## Notes

- Call `startUp()` before using any blob operations.
- Call `shutDown()` during teardown; it is idempotent.
- Shared-key signing is isolated to `ServiceClientBlobStorage`.
- The managed-identity base service no longer supports connection-string bootstrap behavior.
- For local emulator scenarios, `ServiceClientBlobStorage` may use its required `signingConnectionString` to target Azurite while preserving the base service's managed-identity-only contract. This applies when the connection string uses `UseDevelopmentStorage=true` or a `BlobEndpoint` on `localhost`, `127.0.0.1`, `[::1]`, or `host.docker.internal` (Azurite on the host, reached from a container).
