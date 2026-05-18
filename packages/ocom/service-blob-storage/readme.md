# `@ocom/service-blob-storage`

OwnerCommunity application adapter for blob storage with client-upload support via signed SAS URLs.

## Overview

This package provides the application-facing blob storage contract exposed through `ApiContext`. It wraps `@cellix/service-blob-storage` with a **dual-service architecture** for clean separation of concerns:

- **SDK Service**: Uses managed identity (DefaultAzureCredential) for secure blob operations
- **SAS Signing Service**: Optionally uses connection string for generating signed SAS URLs (when client uploads needed)

The adapter exposes a narrow, application-specific interface: `createUploadUrl()` and `createReadUrl()`.

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

## Architecture: Dual Services Pattern

The adapter manages two independent framework services internally:

```
┌─────────────────────────────────────────────────────────┐
│  OCOM ServiceBlobStorage Adapter                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │  SDK Service         │  │ SAS Signing Service  │    │
│  │  (Managed Identity)  │  │ (Connection String)  │    │
│  │                      │  │                      │    │
│  │ • uploadText()       │  │ • createUploadUrl()  │    │
│  │ • uploadStream()     │  │ • createReadUrl()    │    │
│  │ • listBlobs()        │  │                      │    │
│  │ • deleteBlob()       │  │ (Only if needed)     │    │
│  └──────────────────────┘  └──────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Why two services?**

- **SDK Service** (managed identity): Handles all blob operations securely using managed identity
  - No credentials in code
  - Auditable via Azure Monitor
  - Production best practice
  - Always present
  
- **SAS Signing Service** (connection string): Generates signed URLs using shared-key credentials
  - SAS signing requires the AccountKey (can't be done via managed identity)
  - Connection string used **only for signature generation**, not for blob operations
  - Isolated responsibility: blob ops ≠ URL signing
  - Optional: only created if `connectionString` provided

**Benefits**:
- **Single responsibility**: Each service does one thing
- **Explicit separation**: No mixing of authentication modes
- **Opt-in SAS signing**: Applications without client uploads don't need/pay for the signing service
- **Testable**: Each service can be mocked independently
- **Clear intent**: Code shows exactly what authentication each operation uses

## Architecture Decision: Why Dual-Service Pattern?

OCOM requires both:

1. **Secure server→blob operations** (avatars, community documents, etc.)
   - Uses managed identity (best practice)
   - No credentials in application code
   - Auditable via Azure Monitor

2. **Secure client→blob uploads** (member uploads)
   - Server generates signed SAS URLs with constraints
   - Client uploads directly to Azure (server doesn't proxy)
   - Azure validates signature; rejects unauthorized requests

The challenge: A single `ServiceBlobStorage` instance can't do both safely because the framework prefers `connectionString` over `accountName` for auth.

**Solution: Dual-service architecture**
- **SDK Service**: Configured with `accountName` only → uses managed identity
- **SAS Signing Service**: Configured with `connectionString` only → signs URLs
- Each service has one job; never mixed up

This pattern ensures:
- Managed identity is used for all blob operations (production best practice)
- Connection string isolated to SAS signing only (narrow credential scope)
- Clear in code which auth method is used where
- Each service independently testable

## Service Contract

```ts
interface ServiceBlobStorage {
  /**
   * Generate a URL for uploading a blob client-side.
   * URL includes a signed SAS token with write-only permissions and time limit.
   * Only available if connectionString was provided in options.
   */
  createUploadUrl(request: CreateBlobAccessUrlRequest): Promise<string>;

  /**
   * Generate a URL for reading a blob client-side.
   * URL includes a signed SAS token with read-only permissions and time limit.
   * Only available if connectionString was provided in options.
   */
  createReadUrl(request: CreateBlobAccessUrlRequest): Promise<string>;

  startUp(): Promise<void>;
  shutDown(): Promise<void>;
}
```

## Configuration

**Environment Variables** (set by deployment):
```bash
# For all environments: account name for blob URL construction
# Used by the SDK service (managed identity)
AZURE_STORAGE_ACCOUNT_NAME=mycompany

# For all environments: connection string for SAS URL signing
# Only passed to the SAS signing service (when provided)
# SDK service does NOT receive this; it uses managed identity
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

**What Happens Internally**:
```ts
// Constructor creates two services:

// 1. SDK service (always)
this.sdkService = new CellixServiceBlobStorage({
  accountName: 'mycompany',
  // NO connectionString here! Uses managed identity
});

// 2. SAS signing service (if connectionString provided)
this.sasSigningService = new CellixServiceBlobStorage({
  connectionString: process.env['AZURE_STORAGE_CONNECTION_STRING'],
  // Separate service, isolated for signing only
});
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

## Why OCOM Chose Dual-Service Pattern

### Considered Alternatives

#### ❌ Alternative 1: Single Service, Always Pass Both Options

```typescript
// Pass both accountName and connectionString to one service
const service = new ServiceBlobStorage({
  accountName: 'mycompany',
  connectionString: process.env['AZURE_STORAGE_CONNECTION_STRING'],
});
```

**Problem**: Framework prefers `connectionString` over `accountName`. Even though we want managed identity for SDK operations, the framework will use shared-key auth when connection string is present. This defeats the entire purpose of managed identity.

#### ❌ Alternative 2: Factory Function That Decides Auth Mode

```typescript
// Factory returns different config based on environment
const options = isProduction
  ? { accountName: 'mycompany' }
  : { connectionString: process.env['...'] };

const service = new ServiceBlobStorage(options);
```

**Problem**: Violates OCOM's service registration pattern where config objects are passed directly to constructors. Creates conditional logic and makes code harder to follow.

#### ✅ Alternative 3: Dual-Service (Chosen)

```typescript
// Each service configured for its single responsibility
this.sdkService = new ServiceBlobStorage({
  accountName: 'mycompany',  // Managed identity
});

this.sasSigningService = new ServiceBlobStorage({
  connectionString: process.env['AZURE_STORAGE_CONNECTION_STRING'],  // Signing only
});
```

**Advantages**:
- Code is explicit: each service's job is clear
- Managed identity guaranteed for SDK (can't accidentally bypass it)
- SAS signing responsibility isolated
- Aligns with OCOM service registration patterns
- Each service independently testable/mockable
- Connection string credential scope is narrow (signing only)

### OCOM's Specific Configuration

OCOM applications require:
1. **Secure blob operations** for avatars, documents, etc. → SDK service with managed identity
2. **Secure client uploads** → SAS signing service with connection string

Both env vars are **required** in OCOM:
```bash
AZURE_STORAGE_ACCOUNT_NAME=mycompany          # For SDK operations and URL construction
AZURE_STORAGE_CONNECTION_STRING=SharedAccessSignature=sv=...  # For SAS signing
```

Configuration validation (@apps/api) ensures both are present:
```typescript
if (!storageConnectionString) {
  throw new Error(
    'Missing AZURE_STORAGE_CONNECTION_STRING. Required for SAS signing (client uploads).'
  );
}
if (!storageAccountName) {
  throw new Error(
    'Missing AZURE_STORAGE_ACCOUNT_NAME. Required for blob operations and URL construction.'
  );
}
```

This is **OCOM-specific** and may differ from other Cellix consumers who don't need client uploads (see [ADR-0032](../../decisions/0032-azure-blob-storage-client-uploads.md) for framework flexibility patterns).

| Environment | SDK Service | SAS Signing | Why |
|---|---|---|---|
| **Local (Azurite)** | Connection String | Connection String | Emulator doesn't support managed identity; both services use connection string |
| **Production** | Managed Identity | Connection String | MI for ops (secure); shared-key only for signatures (isolated) |
| **CI/CD Tests** | Connection String | Connection String | Tests use Azurite or mock services |

**Result**: Same code runs everywhere; authentication determined by configuration, not code changes.

## Opt-In Pattern: Connection String is Optional

If an application doesn't need client uploads (all uploads server-side):

```ts
// Provide only accountName
const service = new ServiceBlobStorage({
  accountName: 'mycompany',
  // connectionString: omitted
});

// SDK operations work (managed identity)
// Server-side upload would look like:
// await blobStorage.uploadText(...) 
// BUT: This adapter doesn't expose uploadText (it only exposes SAS methods)
// For server uploads, use the framework service directly

// SAS operations fail with clear error
await service.createUploadUrl(...); 
// ❌ Error: "Client uploads with SAS signing are not configured..."
```

Connection string is **required only when client uploads are needed**.

## Error Handling

```ts
// Service not started
const service = new ServiceBlobStorage({ accountName: 'acct' });
await service.createUploadUrl(...);
// ❌ Error: "OCOM ServiceBlobStorage adapter is not started - cannot access service"

// No connection string for SAS (SAS signing not configured)
const service = new ServiceBlobStorage({ accountName: 'acct' });
await service.startUp();
await service.createUploadUrl(...);
// ❌ Error: "Client uploads with SAS signing are not configured..."

// Valid call (both accountName and connectionString provided)
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

**Unit tests** (with mocks):
```ts
const mockBlobStorage: Partial<ServiceBlobStorage> = {
  createUploadUrl: vi.fn().mockResolvedValue('https://test-url'),
  createReadUrl: vi.fn().mockResolvedValue('https://test-url'),
  startUp: vi.fn(),
  shutDown: vi.fn(),
};
```

**Integration tests** (with Azurite):
```ts
import { startAzuriteBlobServer } from '@cellix/service-blob-storage/test-support';

beforeAll(async () => {
  azurite = await startAzuriteBlobServer();
  service = new ServiceBlobStorage({
    accountName: 'devstoreaccount1',
    connectionString: azurite.connectionString,
  });
  await service.startUp();
});

afterAll(async () => {
  await service.shutDown();
  await azurite.stop();
});

it('generates valid SAS URLs', async () => {
  const uploadUrl = await service.createUploadUrl({
    containerName: 'test-container',
    blobName: 'test.txt',
    expiresOn: new Date(Date.now() + 5 * 60 * 1000),
  });
  expect(uploadUrl).toMatch(/sv=.*/); // SAS token present
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
