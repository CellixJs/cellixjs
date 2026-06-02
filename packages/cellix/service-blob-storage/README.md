# `@cellix/service-blob-storage`

Reusable Azure Blob Storage infrastructure service for Cellix applications.

## Overview

`@cellix/service-blob-storage` exposes the framework-native blob contract:

- `ServiceBlobStorage` implementing Cellix `ServiceBase` lifecycle conventions
- Blob operations for upload, list, and delete
- Optional shared-key signing capability for:
  - blob-scoped read SAS token generation
  - direct client PUT/GET authorization header generation via `createBlobWriteAuthorizationHeader()` and `createBlobReadAuthorizationHeader()`

The package separates two concerns:

- how the Azure Blob SDK client authenticates for server-side operations
- whether shared-key signing features are enabled

## Blob Client Authentication

### Managed identity mode

Use `accountName` when Azure SDK operations should authenticate with `DefaultAzureCredential`.

```ts
import { ServiceBlobStorage } from '@cellix/service-blob-storage';

const blobStorage = new ServiceBlobStorage({
	accountName: 'mystorageaccount',
});

await blobStorage.startUp();

await blobStorage.uploadText({
	containerName: 'member-assets',
	blobName: 'members/123/info.txt',
	text: 'Member info',
});
```

Use this mode for production backend blob operations on Azure.

### Shared-key blob client mode

Use `connectionString` when blob operations or signing must use shared-key credentials.

```ts
const blobStorage = new ServiceBlobStorage({
	connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
});

await blobStorage.startUp();

const uploadHeader = await blobStorage.createBlobWriteAuthorizationHeader({
	containerName: 'member-assets',
	blobName: 'avatars/member-123.png',
	contentLength: 102400,
	contentType: 'image/png',
});
```

Use this mode for local Azurite development and for downstream adapters that need direct client upload signing.

## Optional Shared-Key Signing Capability

Applications that use managed identity for server-side blob operations can still opt into shared-key signing explicitly:

```ts
const clientUploadService = new ServiceBlobStorage({
	accountName: 'mystorageaccount',
	signingConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
});

await clientUploadService.startUp();

const uploadHeader = await clientUploadService.createBlobWriteAuthorizationHeader({
	containerName: 'member-assets',
	blobName: 'avatars/member-123.png',
	contentLength: 102400,
	contentType: 'image/png',
});
```

This keeps the connection string dependency scoped to direct-upload signing rather than coupling it to every blob-storage consumer.

## Recommended Registration Pattern

The same `ServiceBlobStorage` class can be registered multiple times with different semantic roles.

```ts
import { ServiceBlobStorage } from '@cellix/service-blob-storage';

Cellix.initializeInfrastructureServices((registry) => {
	registry
		.registerInfrastructureService(
			new ServiceBlobStorage({ accountName: config.accountName }),
			'BlobStorageService',
		)
		.registerInfrastructureService(
			new ServiceBlobStorage({
				accountName: config.accountName,
				signingConnectionString: config.connectionString,
			}),
			'ClientOperationsService',
		);
});
```

Result:

- `BlobStorageService` owns backend SDK operations
- `ClientOperationsService` exposes the same framework class with signing capability enabled
- application context can still narrow each registration to the interfaces that match its intended use

## API Surface

### Public exports

Import from the package root only:

```ts
import {
	ServiceBlobStorage,
	type BlobAddress,
	type BlobListItem,
	type BlobStorage,
	type BlobUploadAuthorizationHeader,
	type CreateBlobAuthorizationHeaderRequest,
	type CreateBlobSasUrlRequest,
	type ListBlobsRequest,
	type UploadTextBlobRequest,
} from '@cellix/service-blob-storage';
```

### Lifecycle

- `startUp(): Promise<BlobStorage>`
- `shutDown(): Promise<void>`

### Blob operations

- `uploadText(request): Promise<BlobUploadCommonResponse>`
- `listBlobs(request): Promise<BlobListItem[]>`
- `deleteBlob(address): Promise<void>`

### Shared-key-only operations

- `generateReadSasToken(request): Promise<string>`
- `createBlobWriteAuthorizationHeader(request): Promise<BlobUploadAuthorizationHeader>`
- `createBlobReadAuthorizationHeader(request): Promise<BlobUploadAuthorizationHeader>`

These methods require shared-key signing capability. That capability is enabled when:

- the service is constructed with `connectionString`, or
- the service is constructed with `signingConnectionString`

## Error Handling

### Service not started

```ts
const blobService = new ServiceBlobStorage({ accountName: 'myaccount' });
await blobService.uploadText(...); // throws
```

### Shared-key-only method in managed-identity mode

```ts
const blobService = new ServiceBlobStorage({ accountName: 'myaccount' });
await blobService.startUp();

await blobService.createBlobWriteAuthorizationHeader(...); // throws
await blobService.createBlobReadAuthorizationHeader(...); // throws
await blobService.generateReadSasToken(...); // throws
```

### Shutdown is idempotent

```ts
await blobService.shutDown();
await blobService.shutDown();
```

## Integration with Application Context

Application packages can expose narrow context interfaces even when infrastructure bootstrap registers the full framework service class. For OCOM, see `@ocom/service-blob-storage`.
