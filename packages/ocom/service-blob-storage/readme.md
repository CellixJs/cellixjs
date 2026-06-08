# `@ocom/service-blob-storage`

OwnerCommunity blob-storage adapter package.

## Overview

This package turns the framework-native Cellix blob service into the narrower contracts OCOM application code should consume:

- `BlobStorageOperations`
  - a narrow view of the framework `ServiceBlobStorage` class for backend blob operations such as `uploadText()`, `listBlobs()`, and `deleteBlob()`
- `ClientUploadOperations`
  - a narrow view of the framework `ServiceBlobStorage` class for client-facing signing operations `createBlobWriteAuthorizationHeader()` and `createBlobReadAuthorizationHeader()`
- `ServiceBlobStorage`
  - direct re-export of the framework implementation for application code that wants the full class and its Cellix-owned docs

## Why this package exists

`@cellix/service-blob-storage` remains the one framework service class. OCOM uses this package only to define the narrowed contracts that application context should expose:

- `blobStorageService: BlobStorageOperations`
- `clientOperationsService: ClientUploadOperations`

That lets application code depend on intent-focused views without redefining the underlying method contracts locally. `@ocom/service-blob-storage` is the package app code should import when it needs the service class itself.

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
	blobStorageService: ServiceBlobStorage;
	clientOperationsService: ServiceBlobStorage;
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
