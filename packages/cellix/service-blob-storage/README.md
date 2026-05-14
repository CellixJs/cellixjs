# `@cellix/service-blob-storage`

Reusable Azure Blob Storage infrastructure service for Cellix applications.

## What it provides

- A `ServiceBlobStorage` class that follows the Cellix `ServiceBase` lifecycle
- General blob operations for upload, list, and delete
- Scoped SAS URL generation for read and write scenarios
- A framework-level contract that application packages can wrap into narrower context-facing services

## Example

```ts
import { ServiceBlobStorage } from '@cellix/service-blob-storage';

const blobStorage = new ServiceBlobStorage({
	connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
});

await blobStorage.startUp();

const uploadUrl = await blobStorage.createBlobWriteSasUrl({
	containerName: 'member-assets',
	blobName: 'avatars/member-123.png',
	expiresOn: new Date(Date.now() + 5 * 60 * 1000),
});
```

## Design notes

- Azure SDK details stay inside this package.
- Application code should not receive this full framework contract directly.
- Downstream packages should adapt this service into a scoped consumer contract before exposing it through application context.
