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

## Feature flags

Feature flags are opt-in on the OCOM storage service during API infrastructure configuration. The API supplies the Blob location and application-local fallback options when the configured Blob does not exist.

```ts
const blobStorageService = new ServiceBlobStorage({ accountName: config.accountName }).enableFeatureFlags({
	containerName: 'public',
	blobName: config.featureFlagBlobName,
	fallback: { FeatureFlags: [] },
});

const { FeatureFlags } = await blobStorageService.getFeatureFlags();
const newMemberFlow = FeatureFlags.find((featureFlag) => featureFlag.Name === 'NEW_MEMBER_FLOW');

if (newMemberFlow?.Value === 'true') {
	// Enable the new member flow.
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
	type FeatureFlag,
	type FeatureFlagsPayloadType,
	type FeatureFlagStoreOptions,
} from '@ocom/service-blob-storage';
```
