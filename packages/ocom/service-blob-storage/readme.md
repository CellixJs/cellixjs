# `@ocom/service-blob-storage`

OwnerCommunity blob-storage adapter package.

## Overview

This package adapts the framework-native Cellix blob services into the narrower contracts OCOM application code should consume:

- `BlobStorageOperations`
  - a narrow view of `ServiceBlobStorage` for backend blob operations such as `uploadText()`, `listBlobs()`, and `deleteBlob()`
- `ClientUploadOperations`
  - a narrow view of `ServiceClientBlobStorage` for client-facing signing operations `createBlobWriteAuthorizationHeader()` and `createBlobReadAuthorizationHeader()`
- `ServiceBlobStorage`
  - direct re-export of the framework managed-identity service for backend registration
- `ServiceClientBlobStorage`
  - direct re-export of the framework client-signing service for client upload/download registration

## Registration pattern

```ts
import { ServiceBlobStorage, ServiceClientBlobStorage } from '@ocom/service-blob-storage';

registry
	.registerInfrastructureService(
		new ServiceBlobStorage({ accountName: config.accountName }),
		'BlobStorageService',
	)
	.registerInfrastructureService(
		new ServiceClientBlobStorage({
			accountName: config.accountName,
			signingConnectionString: config.signingConnectionString,
		}),
		'ClientOperationsService',
	);
```

## Context exposure

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

## Public exports

```ts
import {
	ServiceBlobStorage,
	ServiceClientBlobStorage,
	type BlobStorageOperations,
	type ClientUploadOperations,
	type CreateBlobAccessUrlRequest,
} from '@ocom/service-blob-storage';
```
