# `@ocom/service-blob-storage`

OwnerCommunity application adapter for blob storage with client-upload support via signed SAS URLs.

## Overview

This package provides the application-facing blob storage contract exposed through `ApiContext`. It wraps `@cellix/service-blob-storage` and:

- Implements **managed identity** for secure SDK operations (production best practice)
- Provides **signed SAS URLs** for client uploads (when connection string configured)
- Exposes a narrow, application-specific interface: `createUploadUrl()` and `createReadUrl()`
- Keeps raw framework service details internal (isolation of concerns)

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

## Service Contract

```ts
interface ServiceBlobStorage {
  /**
   * Generate a URL for uploading a blob client-side.
   * URL includes a signed SAS token with write-only permissions and time limit.
   */
  createUploadUrl(request: CreateBlobAccessUrlRequest): Promise<string>;

  /**
   * Generate a URL for reading a blob client-side.
   * URL includes a signed SAS token with read-only permissions and time limit.
   */
  createReadUrl(request: CreateBlobAccessUrlRequest): Promise<string>;

  startUp(): Promise<void>;
  shutDown(): Promise<void>;
}
```

## Architecture: Dual Services

Internally, the adapter manages two framework services to separate concerns:

```ts
// SDK operations: Uses managed identity (production-secure)
private readonly frameworkService: BlobStorage;

// SAS signing: Uses connection string (for signature generation only)
// The connection string is passed separately and never used for SDK auth
```

**Why two services?**

- **Framework service** (managed identity mode): Handles all blob operations securely using managed identity
  - No credentials in code
  - Auditable via Azure Monitor
  - Production best practice
  
- **SAS signing** (connection string mode): Generates signed URLs using shared-key credentials
  - SAS signing requires the AccountKey (can't be done via managed identity)
  - Connection string used only for signature generation, not for blob operations
  - Isolated responsibility: SDK operations ≠ URL signing

## Configuration

**Environment Variables** (set by deployment):
```bash
# For all environments: account name for blob URL construction
AZURE_STORAGE_ACCOUNT_NAME=mycompany

# For all environments: connection string for SAS URL signing
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https://...AccountKey=...
```

**Service Registration**:
```ts
// @apps/api/src/index.ts
const service = new ServiceBlobStorage({
  accountName: 'mycompany',
  connectionString: process.env['AZURE_STORAGE_CONNECTION_STRING'],
});

cellix.registerInfrastructureService(service);
```

**Exposed in ApiContext**:
```ts
// Application code receives narrow interface
const { blobStorage } = context;
const uploadUrl = await blobStorage.createUploadUrl({
  containerName: 'member-assets',
  blobName: 'avatars/member-123.png',
  expiresOn: new Date(Date.now() + 15 * 60 * 1000),
});
```

## Example: Member Avatar Upload

### 1. Client requests upload URL

```ts
// Client-side (GraphQL mutation)
mutation RequestAvatarUploadUrl($blobName: String!) {
  requestMemberAvatarUploadUrl(blobName: $blobName) {
    uploadUrl
    expiresAt
  }
}
```

### 2. Server generates signed URL

```ts
// Server-side (application service)
export class MemberAvatarService {
  constructor(private readonly blobStorage: ServiceBlobStorage) {}

  async generateUploadUrl(memberId: string, fileName: string): Promise<string> {
    return this.blobStorage.createUploadUrl({
      containerName: 'member-assets',
      blobName: `members/${memberId}/avatars/${fileName}`,
      expiresOn: new Date(Date.now() + 15 * 60 * 1000), // 15 min
    });
  }
}
```

### 3. Client uploads directly to Azure

```ts
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

## Authentication Strategy: Managed Identity in Production

| Environment | SDK Auth | SAS Signing | Why |
|---|---|---|---|
| **Local (Azurite)** | Connection String | Connection String | Emulator doesn't support managed identity |
| **Production** | Managed Identity | Connection String | MI secure for ops; shared-key only for signatures |
| **CI/CD Tests** | Connection String | Connection String | Tests use Azurite |

**Result**: Same code runs everywhere; authentication strategy determined by environment, not by code changes.

## Opt-In Pattern: Connection String is Optional

If an application doesn't need client uploads (all uploads server-side):

```ts
// Can provide only accountName
const service = new ServiceBlobStorage({
  accountName: 'mycompany',
  // connectionString: omitted
});

// SDK operations work (managed identity)
await service.uploadText(...); // ✅ Works

// SAS operations fail (expected)
await service.createUploadUrl(...); 
// ❌ Throws: "Cannot create SAS URL without connection string configured"
```

Connection string is **required only when client uploads are needed**.

## Error Handling

```ts
// Service not started
const service = new ServiceBlobStorage({ accountName: 'acct' });
await service.createUploadUrl(...);
// ❌ Error: "OCOM ServiceBlobStorage adapter is not started - cannot access service"

// No connection string for SAS
const service = new ServiceBlobStorage({ accountName: 'acct' });
await service.startUp();
await service.createUploadUrl(...);
// ❌ Error: "Cannot create SAS URL without connection string configured"

// Valid call
const service = new ServiceBlobStorage({ 
  accountName: 'acct',
  connectionString: 'DefaultEndpointsProtocol=...'
});
await service.startUp();
const url = await service.createUploadUrl(...);
// ✅ Returns signed SAS URL
```

## Integration with Domain Logic

The blob storage adapter is typically injected into application services:

```ts
export class CommunityDocumentService {
  constructor(
    private readonly blobStorage: ServiceBlobStorage,
    private readonly communityRepository: CommunityRepository,
  ) {}

  async generateDocumentUploadUrl(
    communityId: string,
    fileName: string,
  ): Promise<{ uploadUrl: string; expiresAt: Date }> {
    const community = await this.communityRepository.findById(communityId);
    
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const uploadUrl = await this.blobStorage.createUploadUrl({
      containerName: 'community-assets',
      blobName: `communities/${communityId}/documents/${fileName}`,
      expiresOn: expiresAt,
    });

    return { uploadUrl, expiresAt };
  }
}
```

## Testing

```ts
// Mock for unit tests
const mockBlobStorage: Partial<ServiceBlobStorage> = {
  createUploadUrl: vi.fn().mockResolvedValue('https://test-url'),
  createReadUrl: vi.fn().mockResolvedValue('https://test-url'),
  startUp: vi.fn(),
  shutDown: vi.fn(),
};
```

```ts
// Integration tests can use Azurite
import { startAzuriteBlobServer } from '@cellix/service-blob-storage/test-support';

beforeAll(async () => {
  azurite = await startAzuriteBlobServer();
  service = new ServiceBlobStorage({
    connectionString: azurite.connectionString,
  });
  await service.startUp();
});

afterAll(async () => {
  await service.shutDown();
  await azurite.stop();
});
```

## Related Documentation

- **ADR-0032**: [Azure Blob Storage & Client Uploads](../../docs/decisions/0032-azure-blob-storage-client-uploads.md) - Full architecture rationale
- **@cellix/service-blob-storage**: Framework service with detailed API docs
- **@cellix/api-services-spec**: Cellix service lifecycle patterns
- **MemberAvatarService**: Example usage in domain layer
- **CommunityDocumentService**: Example usage for document uploads

## Future Enhancements

- Blob deletion endpoint for cleanup
- Container management (create, delete)
- Blob metadata and tagging
- Soft-delete and undelete support
- Versioning for audit trails
