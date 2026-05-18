# `@cellix/service-blob-storage`

Reusable Azure Blob Storage infrastructure service for Cellix applications.

## Overview

`@cellix/service-blob-storage` provides:

- A `ServiceBlobStorage` class implementing Cellix `ServiceBase` lifecycle conventions
- Support for **dual authentication modes**: managed identity (production) and connection string (local dev)
- Blob operations: upload, list, delete via SDK or text upload
- Scoped SAS URL generation for client uploads (when connection string provided)
- Framework-level contract for application packages to wrap into narrower, context-facing services

## Authentication Modes

### Mode 1: Managed Identity (Recommended for Production)

```ts
import { ServiceBlobStorage } from '@cellix/service-blob-storage';

const blobStorage = new ServiceBlobStorage({
	accountName: 'mystorageaccount',
	// SDK will use DefaultAzureCredential (managed identity on Azure)
});

await blobStorage.startUp();

// Blob operations available (read/write/delete)
await blobStorage.uploadText({
	containerName: 'member-assets',
	blobName: 'members/123/info.txt',
	content: 'Member info',
});

// SAS signing NOT available in this mode (no connection string provided)
```

**When to use**:
- Production deployments on Azure
- Applications using Azure Managed Identity for authentication
- No client uploads needed, or client uploads handled via server-side logic

**Requirements**:
- Managed Identity assigned to compute resource (Function App, Container, etc.)
- Storage Blob Data Contributor RBAC role granted to the managed identity
- `AZURE_STORAGE_ACCOUNT_NAME` environment variable set

### Mode 2: Connection String (Local Development & SAS Signing)

```ts
const blobStorage = new ServiceBlobStorage({
	connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
	// For local dev: connection string to Azurite
	// For prod client uploads: connection string with shared-key credentials
});

await blobStorage.startUp();

// All blob operations available
await blobStorage.uploadText({
	containerName: 'member-assets',
	blobName: 'members/123/info.txt',
	content: 'Member info',
});

// SAS URL generation available (uses shared-key credentials from connection string)
const uploadUrl = await blobStorage.createBlobWriteSasUrl({
	containerName: 'member-assets',
	blobName: 'avatars/member-123.png',
	expiresOn: new Date(Date.now() + 5 * 60 * 1000),
});
```

**When to use**:
- Local development with Azurite emulation
- Client-side uploads requiring signed SAS URLs
- Scenarios where shared-key credentials are acceptable

**Requirements**:
- `AZURE_STORAGE_CONNECTION_STRING` environment variable set
- For Azurite: `DefaultEndpointsProtocol=http://...`
- For Azure with shared-key: connection string with AccountKey

### Mode 3: Mixed (Managed Identity + Optional SAS Signing)

This is the typical production pattern when client uploads are needed:

**Configuration layer**:
```ts
// @apps/api/src/service-config/blob-storage
const storageAccountName = process.env['AZURE_STORAGE_ACCOUNT_NAME'];
const storageConnectionString = process.env['AZURE_STORAGE_CONNECTION_STRING'];

export const blobStorageConfig = {
	accountName: storageAccountName,
	connectionString: storageConnectionString, // for SAS signing only
};
```

**Service registration**:
```ts
// @ocom/service-blob-storage/src/service-blob-storage.ts
const frameworkService = new ServiceBlobStorage({
	accountName: config.accountName,
	// Note: connectionString NOT passed here
	// SDK will use managed identity for all blob operations
});

const sasSigningService = new ServiceBlobStorage({
	connectionString: config.connectionString,
	// Used only for SAS URL generation
});
```

**Result**:
- SDK operations use managed identity (secure, auditable)
- Client uploads still get signed SAS URLs (secure client access)
- No shared-key credentials used for blob operations
- Connection string only used for signing (isolation of concerns)

## Complete Example: Client Uploads with Managed Identity

```ts
import { ServiceBlobStorage } from '@cellix/service-blob-storage';

// Framework service for SDK operations (uses managed identity)
const blobService = new ServiceBlobStorage({
	accountName: 'mycompany',
});
await blobService.startUp();

// Upload text (uses managed identity)
await blobService.uploadText({
	containerName: 'member-assets',
	blobName: 'members/123/profile.json',
	content: JSON.stringify({ name: 'Alice' }),
});

// For client uploads, use separate service configured for SAS signing
// (typically done by @ocom/service-blob-storage adapter)
const sasService = new ServiceBlobStorage({
	connectionString: 'DefaultEndpointsProtocol=https://...AccountKey=...',
});
await sasService.startUp();

const uploadUrl = await sasService.createBlobWriteSasUrl({
	containerName: 'member-assets',
	blobName: 'avatars/alice-avatar.png',
	expiresOn: new Date(Date.now() + 15 * 60 * 1000), // 15 min expiry
});

// Send uploadUrl to client browser; client uploads to this signed URL
```

## API Surface

### Lifecycle

- `async startUp(): Promise<void>` - Initialize blob service client
- `async shutDown(): Promise<void>` - Gracefully close resources (idempotent)

### Blob Operations

- `async uploadText(request): Promise<void>` - Upload text content
- `async uploadStream(request): Promise<void>` - Upload from stream
- `async listBlobs(request): Promise<BlobListItem[]>` - List blobs in container
- `async deleteBlob(request): Promise<void>` - Delete a blob

### SAS URL Generation (when connection string provided)

- `async createBlobReadSasUrl(request): Promise<string>` - Generate read-only SAS URL
- `async createBlobWriteSasUrl(request): Promise<string>` - Generate write-only SAS URL

## Design Philosophy

1. **Azure SDK details are internal**: Consumers don't reference `@azure/storage-blob` directly
2. **Framework-level contract only**: Focus on blob operations, not Azure-specific SDK models
3. **Narrower consumer types required**: Application code should NOT depend directly on `ServiceBlobStorage`. Instead, application packages should:
   - Create narrower interfaces (e.g., `BlobStorageOperations`, `ClientUploadService`)
   - Register two specialized instances (one for managed identity, one for SAS signing)
   - Expose only the narrower types in `ApiContext`
   - This ensures type safety and clear intent in application code
4. **Security-forward**: Default to managed identity; connection string optional for local dev or signing
5. **Lifecycle management**: `startUp()` and `shutDown()` follow Cellix service patterns for consistent bootstrapping

### The Narrower Types Pattern

Instead of exposing `ServiceBlobStorage` directly in `ApiContext`, applications should:

```typescript
// ❌ DON'T: Expose the full framework service
interface ApiContextSpec {
  blobService: ServiceBlobStorage; // Too flexible, mixed concerns
}

// ✅ DO: Expose narrower, specialized types
interface ApiContextSpec {
  blobStorageService: BlobStorageOperations;    // Managed identity operations
  clientUploadService: ClientUploadService;     // SAS signing only
}
```

**Why?**
- **Type Safety**: Compiler prevents accidentally calling SAS methods on the backend service
- **Clear Intent**: Function signature tells you which auth method is used
- **Single Responsibility**: Each service has one job
- **Testability**: Each type can be mocked independently
- **Best Practice**: Aligns with Dependency Inversion Principle

See ADR-0032 "Implementation Pattern: Narrower Consumer Types" for the complete pattern and example.

## Error Handling

### Not Started
```ts
const blobService = new ServiceBlobStorage({ accountName: 'myaccount' });
await blobService.uploadText(...); // ❌ Throws: "Framework ServiceBlobStorage is not started"

await blobService.startUp();
await blobService.uploadText(...); // ✅ Works
```

### Shutdown is Idempotent
```ts
await blobService.shutDown(); // ✅ OK even if not started
await blobService.shutDown(); // ✅ OK (safe to call multiple times)
```

### SAS Without Connection String
```ts
const blobService = new ServiceBlobStorage({ accountName: 'myaccount' });
await blobService.startUp();

await blobService.createBlobWriteSasUrl(...);
// ❌ Throws: "Cannot create SAS URL without connection string configured"
```

## Integration with OCOM Applications

See `@ocom/service-blob-storage` for the application-facing adapter that:
- Wraps the framework service
- Provides `createUploadUrl()` and `createReadUrl()` methods
- Registers itself in `ApiContext` for dependency injection
- Handles the dual-service pattern (managed identity + SAS signing)

## Testing

- Mock `@azure/storage-blob` client to avoid Azurite/Azure dependencies
- Or use Azurite test helper (see `src/test-support/azurite.ts`)
- Integration tests cover startup, upload, list, delete, and SAS generation paths

## Related Documentation

- **ADR-0032**: [Azure Blob Storage & Client Uploads](../../decisions/0032-azure-blob-storage-client-uploads.md) - Architecture decision for dual auth modes
- **ADR-0014**: [Azure Infrastructure Deployments](../../decisions/0014-azure-infrastructure-deployments.md) - Managed identity and RBAC setup
- **@cellix/api-services-spec**: Cellix infrastructure service lifecycle patterns
- **@ocom/service-blob-storage**: Application adapter and usage example

## Roadmap

- Support for User Delegation Keys (for pure Azure AD scenarios)
- Container policy management (retention, versioning)
- Batch operations (delete multiple blobs)
- Server-side encryption configuration
