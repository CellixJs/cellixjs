# `@ocom/service-blob-storage`

OwnerCommunity application contract for blob storage with client-upload support via signed SAS URLs.

## Overview

This package exports **narrower, type-safe consumer interfaces** for blob storage:

- **`BlobStorageOperations`**: Backend blob operations (list, upload, delete) using managed identity
- **`ClientUploadService`**: Secure client-upload URL signing using connection string SAS tokens

These interfaces are implemented by two specialized instances of `@cellix/service-blob-storage` registered separately in `@apps/api` bootstrap, following the **narrower consumer types pattern** documented in ADR-0032.

### Why Two Separate Services?

A single `ServiceBlobStorage` instance with both `accountName` and `connectionString` would use connection-string auth for SDK operations, bypassing managed identity. By registering two instances with different configurations:

- **SDK Service** (managed identity): Handles blob operations securely, no credentials in code
- **SAS Signing Service** (connection string): Generates signed URLs, connection string isolated to signing only

Each service has one responsibility; each is independently testable and type-safe.

## Client Uploads: The Use Case

When a member uploads their avatar or a community uploads a document, the application needs:

1. **Secure server→blob upload** (for app-generated assets)
   - Uses managed identity
   - No credentials exposed to clients

2. **Secure client→blob upload** (for user-generated content)
   - Server generates a signed SAS URL with constraints:
     - Valid container and blob path
     - Time-limited (e.g., 15 minutes)
     - Write-only permissions (no read/delete)
   - Client receives URL and uploads directly to Azure (server doesn't proxy bytes)
   - Azure validates signature and constraints; rejects unauthorized uploads

## Consumer Interfaces

### `BlobStorageOperations`

Operations for backend blob storage access (uses managed identity):

```typescript
export interface BlobStorageOperations {
  /**
   * List all blobs in a container.
   */
  listBlobs(containerName: string): Promise<string[]>;

  /**
   * Upload text content to a blob.
   */
  uploadText(containerName: string, blobName: string, text: string): Promise<void>;

  /**
   * Delete a blob.
   */
  deleteBlob(containerName: string, blobName: string): Promise<void>;
}
```

**Configured with**: `accountName` only (no connection string)  
**Authentication**: Azure Managed Identity (DefaultAzureCredential)  
**Use cases**: Server-side uploads, document storage, cleanup operations

### `ClientUploadService`

Operations for generating signed SAS URLs (uses connection string):

```typescript
export interface ClientUploadService {
  /**
   * Generate a signed URL for client-side blob upload (write-only, time-limited).
   */
  createUploadUrl(request: CreateBlobAccessUrlRequest): Promise<string>;

  /**
   * Generate a signed URL for client-side blob read (read-only, time-limited).
   */
  createReadUrl(request: CreateBlobAccessUrlRequest): Promise<string>;
}
```

**Configured with**: Connection string only  
**Authentication**: Shared-key SAS tokens  
**Use cases**: Member avatars, community documents, member-initiated uploads

## Configuration

**Environment Variables** (set by deployment):

```bash
# Required: account name for blob URL construction and managed identity access
AZURE_STORAGE_ACCOUNT_NAME=mycompany

# Required: connection string for SAS URL signing (client uploads)
# Only passed to the SAS signing service, not the SDK service
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https://...AccountKey=...
```

**Service Registration** (@apps/api):

Both services are registered separately during bootstrap:

```typescript
// blobStorageService: managed identity for backend operations
const blobStorageService = new ServiceBlobStorage({
  accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
  // No connectionString - uses managed identity
});

// clientUploadService: connection string for SAS signing
const clientUploadService = new ServiceBlobStorage({
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
});

cellix.registerInfrastructureService(blobStorageService);
cellix.registerInfrastructureService(clientUploadService);
```

**Exposed in ApiContext**:

```typescript
export interface ApiContextSpec {
  blobStorageService: BlobStorageOperations;  // ← backend ops, managed identity
  clientUploadService: ClientUploadService;   // ← SAS signing only
}
```

Application code receives narrow, specialized types:

```typescript
// Application service
export class CommunityDocumentService {
  constructor(
    private readonly blobStorage: BlobStorageOperations,    // Can't accidentally call SAS methods
    private readonly clientUpload: ClientUploadService,     // Can't accidentally do backend ops
  ) {}

  async generateDocumentUploadUrl(
    communityId: string,
    fileName: string,
  ): Promise<{ uploadUrl: string; expiresAt: Date }> {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    // Type-safe: clientUploadService only has SAS methods
    const uploadUrl = await this.clientUpload.createUploadUrl({
      containerName: 'community-assets',
      blobName: `communities/${communityId}/documents/${fileName}`,
      expiresOn: expiresAt,
    });

    return { uploadUrl, expiresAt };
  }

  async listDocuments(communityId: string): Promise<string[]> {
    // Type-safe: blobStorageService only has backend ops
    return this.blobStorage.listBlobs('community-assets');
  }
}
```

## Example: Member Avatar Upload

### 1. Client requests upload URL

```typescript
// Client-side (GraphQL mutation)
mutation RequestAvatarUploadUrl($blobName: String!) {
  requestMemberAvatarUploadUrl(blobName: $blobName) {
    uploadUrl
    expiresAt
  }
}
```

### 2. Server generates signed URL

```typescript
// Server-side (application service)
export class MemberAvatarService {
  constructor(private readonly clientUpload: ClientUploadService) {}

  async generateUploadUrl(memberId: string, fileName: string): Promise<string> {
    return this.clientUpload.createUploadUrl({
      containerName: 'member-assets',
      blobName: `members/${memberId}/avatars/${fileName}`,
      expiresOn: new Date(Date.now() + 15 * 60 * 1000), // 15 min
    });
  }
}
```

### 3. Client uploads directly to Azure

```typescript
// Client-side (browser)
const file = document.getElementById('avatar-input').files[0];
const { uploadUrl } = await graphqlRequest(RequestAvatarUploadUrl, {
  blobName: file.name,
});

const response = await fetch(uploadUrl, {
  method: 'PUT',
  headers: { 'x-ms-blob-type': 'BlockBlob' },
  body: file,
});

if (response.ok) {
  // Upload complete; no server involvement needed
}
```

## Authentication Modes by Environment

| Environment | SDK Service | SAS Signing | Why |
|---|---|---|---|
| **Local (Azurite)** | Connection String | Connection String | Emulator doesn't support managed identity; both services use connection string |
| **Production** | Managed Identity | Connection String | MI for ops (secure); shared-key only for signatures (isolated) |
| **CI/CD Tests** | Connection String | Connection String | Tests use Azurite or mock services |

**Result**: Same code runs everywhere; authentication determined by configuration, not code changes.

## Error Handling

```typescript
// Service not started
const { clientUploadService } = context;
await clientUploadService.createUploadUrl(...);
// ❌ Error: "Framework ServiceBlobStorage is not started"

// Valid call (both services started)
await context.clientUploadService.createUploadUrl({
  containerName: 'member-assets',
  blobName: 'members/123/avatar.png',
  expiresOn: new Date(Date.now() + 15 * 60 * 1000),
});
// ✅ Returns signed SAS URL
```

## Integration with Domain Logic

The narrower interfaces are typically injected into domain services:

```typescript
import type { BlobStorageOperations, ClientUploadService } from '@ocom/service-blob-storage';

export class MemberService {
  constructor(
    private readonly blobStorage: BlobStorageOperations,
    private readonly clientUpload: ClientUploadService,
    private readonly memberRepository: MemberRepository,
  ) {}

  async updateMemberAvatar(
    memberId: string,
    fileName: string,
  ): Promise<{ uploadUrl: string; expiresAt: Date }> {
    // Type-safe: can only call SAS methods
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const uploadUrl = await this.clientUpload.createUploadUrl({
      containerName: 'member-assets',
      blobName: `members/${memberId}/avatars/${fileName}`,
      expiresOn: expiresAt,
    });

    return { uploadUrl, expiresAt };
  }

  async deleteMemberAvatar(memberId: string, fileName: string): Promise<void> {
    // Type-safe: can only call backend ops
    await this.blobStorage.deleteBlob(
      'member-assets',
      `members/${memberId}/avatars/${fileName}`,
    );
  }
}
```

## Testing

**Unit tests** (with mocks):

```typescript
const mockBlobStorage: Partial<BlobStorageOperations> = {
  listBlobs: vi.fn().mockResolvedValue([]),
  uploadText: vi.fn(),
  deleteBlob: vi.fn(),
};

const mockClientUpload: Partial<ClientUploadService> = {
  createUploadUrl: vi.fn().mockResolvedValue('https://test-url'),
  createReadUrl: vi.fn().mockResolvedValue('https://test-url'),
};
```

**Integration tests** (with Azurite):

```typescript
import { startAzuriteBlobServer } from '@cellix/service-blob-storage/test-support';

beforeAll(async () => {
  azurite = await startAzuriteBlobServer();
  
  // Both services use Azurite connection string in test
  const blobStorage = new ServiceBlobStorage({
    connectionString: azurite.connectionString,
  });
  
  const clientUpload = new ServiceBlobStorage({
    connectionString: azurite.connectionString,
  });
  
  await blobStorage.startUp();
  await clientUpload.startUp();
});
```

## The Narrower Consumer Types Pattern

This package exemplifies the pattern recommended in ADR-0032:

1. **Framework service is flexible** (`@cellix/service-blob-storage`): Supports multiple auth modes, optional features
2. **Application packages create narrower types**: Split full contract into focused interfaces
3. **Bootstrap registers specialized instances**: Each instance has one job, one config
4. **Context exposes only narrower types**: Application code is type-safe and explicit

This pattern ensures:
- **Type safety**: Compiler prevents misuse
- **Clear intent**: Code shows which auth method is used
- **No mixing**: Each service has one responsibility
- **Testability**: Easy to mock and test independently
- **Scalability**: Easy to add more services as needs grow

## Related Documentation

- **ADR-0032**: [Azure Blob Storage & Client Uploads](../../decisions/0032-azure-blob-storage-client-uploads.md) - Full architecture rationale, pattern explanation, and consumer examples
- **@cellix/service-blob-storage**: Framework service with detailed API docs and authentication modes
- **@ocom/context-spec**: Application context definition with narrower types
