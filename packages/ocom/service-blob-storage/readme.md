# `@ocom/service-blob-storage`

OwnerCommunity blob-storage adapter package.

## Overview

This package turns the framework-native Cellix blob service into the narrower contracts OCOM application code should consume:

- `BlobStorageOperations`
  - backend blob operations such as `uploadText()`, `listBlobs()`, and `deleteBlob()`
- `ClientUploadOperations`
  - client-facing signing operations `createBlobWriteAuthorizationHeader()` and `createBlobReadAuthorizationHeader()`
- `ServiceBlobStorage`
  - OCOM application-facing service class that extends the framework implementation

## Why this package exists

`@cellix/service-blob-storage` remains the one framework service class. OCOM uses this package only to define the narrowed contracts that application context should expose:

- `blobStorageService: BlobStorageOperations`
- `clientOperationsService: ClientUploadOperations`

That lets application code depend on intent-focused interfaces even though infrastructure bootstrap can register `ServiceBlobStorage` in multiple semantic roles.
`@ocom/service-blob-storage` is the package app code should import when it needs the service class itself.

## Registration Pattern

```ts
import { ServiceBlobStorage } from '@ocom/service-blob-storage';

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
```

The first registration handles backend blob SDK operations. The second keeps the same framework class but opts into shared-key signing capability for client upload/read flows.

## Context Exposure

```ts
export interface ApiContextSpec {
	blobStorageService: BlobStorageOperations;
	clientOperationsService: ClientUploadOperations;
}
```

## Example

```ts
export class MemberAvatarService {
	public constructor(private readonly clientOperations: ClientUploadOperations) {}

	public createAvatarUpload(memberId: string) {
		return this.clientOperations.createBlobWriteAuthorizationHeader({
			containerName: 'member-assets',
			blobName: `members/${memberId}/avatar.png`,
			contentLength: 1024,
			contentType: 'image/png',
		});
	}
}
```

## Public Exports

```ts
import {
	ServiceBlobStorage,
	type BlobStorageOperations,
	type ClientUploadOperations,
	type CreateBlobAccessUrlRequest,
} from '@ocom/service-blob-storage';
```
