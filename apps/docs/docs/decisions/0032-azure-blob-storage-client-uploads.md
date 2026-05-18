---
sidebar_position: 32
sidebar_label: 0032 Azure Blob Storage & Client Uploads
description: "Architecture decision for managed identity authentication, SAS signing for client uploads, and service-layer blob storage integration."
status: accepted
contact: nnoce14
date: 2026-05-18
deciders: nnoce14
consulted:
informed:
---

# Azure Blob Storage with Managed Identity & Canonical SharedKey Auth Headers for Secure Client Uploads

## Context and Problem Statement

Applications need to:

1. **Store and retrieve binary assets securely** (e.g., member avatars, community documents)
2. **Enable client-side uploads** without exposing storage credentials or allowing uncontrolled blob creation
3. **Prevent replay attacks** where a client attempts to upload a different file using an authorization header signed for another file
4. **Maintain production-grade security** using Azure best practices (managed identity, no shared keys in code for SDK operations)
5. **Support local development** (Azurite emulation) and production deployments with the same code
6. **Decouple authentication strategy** (managed identity for backend) from client-upload signing requirements (SharedKey auth headers)

### The Challenge

Azure Blob Storage supports multiple authentication approaches:

- **Shared Key (connection string)**: Simple for development, but credentials in env vars; not recommended for production SDK operations
- **Managed Identity (DefaultAzureCredential)**: Production best practice on Azure, no credentials to leak, but doesn't provide auth signing for clients
- **Service Principal/SAS tokens**: More control, but adds credential management complexity; SAS URLs are time-expiration-only (no metadata binding)
- **Canonical SharedKey Auth Headers**: Microsoft Azure Storage standard (per REST API spec) that signs headers with blob metadata (Content-Length, Content-Type, blob path); impossible to replay on different blobs

Earlier implementations used **SAS tokens for client uploads**, which are flexible but lack metadata binding:
- Client could take a SAS URL signed for `file-a.txt` and attempt to use it on `file-b.txt` (server-side validation required)
- SAS tokens only enforce time expiration and permissions, not the specific blob identity or metadata

**Canonical SharedKey authorization headers provide cryptographic metadata-locking:**
- Signature includes HTTP method, blob path, Content-Length, Content-Type, and custom metadata headers
- Different blob → different signature (mathematically impossible to forge)
- Different file size → different signature (content-length in canonical string)
- Different content type → different signature (included in signing process)
- Replay attacks across blobs are cryptographically impossible (not just policy-enforced)

For Cellix applications, the pattern is:
- Backend blob operations (read/write/delete) → use **managed identity** (secure, auditable)
- Client uploads → require **signed canonical SharedKey auth headers** → need shared-key credentials only to sign the header
- Server handles both paths, using managed identity for backend and shared keys only for client-upload signing (narrowly scoped)

### Prior Attempts

Earlier iterations tried to:
1. Always use connection strings for everything (insecure in production, config forced it everywhere)
2. Use a single auth strategy everywhere (rigid, prevented managed identity even when client uploads weren't needed)
3. Use SAS tokens for client uploads (flexible but lacking metadata-binding security)

This ADR establishes the pattern: **managed identity for SDK operations + canonical SharedKey auth headers for client uploads (metadata-locked, replay-proof)**.

## Decision Drivers

- **Production security best practice**: Managed identity (no credentials in code/environment) + canonical auth headers (cryptographic metadata binding)
- **Replay attack prevention**: Canonical auth headers lock metadata (blob name, content-length, content-type) in the signature; different blobs = mathematically different signatures
- **Local development support**: Azurite with connection string must work
- **Flexible opt-in**: Not all applications need client uploads; connection string should be optional
- **Clear architecture**: Separate concerns (SDK auth from header signing)
- **No credential exposure**: Never pass credentials through application code
- **Framework reusability**: Service should support both scenarios: managed-identity-only and managed-identity + client uploads
- **Metadata binding**: Server authorization should include file characteristics (size, type) so clients cannot upload arbitrary metadata

## Considered Options

### Option A: Always Use Managed Identity (No Client Uploads)

- **Pros**: Simplest, most secure, no connection strings anywhere
- **Cons**: Can't generate SAS URLs for client uploads; forces server-side upload only
- **Verdict**: Valid for server-only applications, but Cellix applications require client uploads for UX

### Option B: Always Provide Connection String (Status Quo Anti-Pattern)

- **Pros**: Supports client uploads
- **Cons**: Connection strings in environment variables; SDK uses shared-key auth instead of managed identity in production; security anti-pattern
- **Verdict**: Rejected (violates Azure best practices)

### Option C: Dual-Mode Authentication (Chosen)

- **Backend SDK operations**: Use managed identity (DefaultAzureCredential) for all blob operations
- **Client-upload signing**: Separately use shared-key credentials only for SAS URL generation
- **Connection string**: Optional, only required when client uploads are needed
- **Local development**: Automatically detects Azurite via connection string, uses it for both SDK and signing
- **Production**: Uses managed identity for SDK, shared-key credentials only for signing (via env var)
- **Flexibility**: Consumers can provide only `accountName` if they don't need client uploads (opt-in)

## Implementation Pattern: Narrower Consumer Types

The framework service (`@cellix/service-blob-storage`) exposes a full interface with all operations and flexibility. However, **applications should not depend directly on the framework service**. Instead, application packages should:

1. **Split into narrower interfaces** scoped to specific use cases:
   - `BlobStorageOperations` - for backend blob operations (list, upload, delete) via managed identity
   - `ClientUploadService` - for client-side upload URL signing via connection string

2. **Register two specialized instances** of the framework service in the bootstrap layer:
   - One configured for managed identity (no connection string)
   - One configured for SAS signing (with connection string)

3. **Expose only the narrower types** in the `ApiContext` so application code is type-safe and unambiguous

### Why This Pattern?

- **Type Safety**: Application code sees only what it should use; compiler prevents misuse
- **Clear Intent**: Looking at `BlobStorageOperations` immediately tells you "this service uses managed identity"
- **No Ambiguity**: Two services with two clear purposes; no mixing of authentication modes
- **Testability**: Each interface can be mocked independently
- **Scalability**: Easy to add more specialized services; context remains clean
- **Best Practice**: Aligns with Dependency Inversion Principle - depend on abstractions, not concretions

### Example for Consumers

```typescript
// 1. Define narrower interface (application package)
export interface BlobStorageOperations {
  listBlobs(containerName: string): Promise<string[]>;
  uploadText(containerName: string, blobName: string, text: string): Promise<void>;
  deleteBlob(containerName: string, blobName: string): Promise<void>;
}

export interface ClientUploadService {
  createUploadUrl(request: CreateBlobSasUrlRequest): Promise<string>;
  createReadUrl(request: CreateBlobSasUrlRequest): Promise<string>;
}

// 2. Register both framework services with different configs (bootstrap)
const blobStorageService = new ServiceBlobStorage({
  accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
  // No connectionString - uses managed identity
});

const clientUploadService = new ServiceBlobStorage({
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  // For SAS signing only
});

cellix.registerInfrastructureService(blobStorageService);
cellix.registerInfrastructureService(clientUploadService);

// 3. Expose narrower types in ApiContext
export interface ApiContextSpec {
  blobStorageService: BlobStorageOperations;
  clientUploadService: ClientUploadService;
}

// 4. Application code receives narrow types, uses accordingly
class CommunityDocumentService {
  constructor(
    private readonly blobStorage: BlobStorageOperations,      // ← backend ops only
    private readonly clientUpload: ClientUploadService,       // ← signing only
  ) {}

  async generateUploadUrl(communityId: string, fileName: string): Promise<string> {
    return this.clientUpload.createUploadUrl({
      containerName: 'community-assets',
      blobName: `communities/${communityId}/documents/${fileName}`,
      expiresOn: new Date(Date.now() + 15 * 60 * 1000),
    });
  }

  async listDocuments(communityId: string): Promise<string[]> {
    return this.blobStorage.listBlobs('community-assets');
  }
}
```

This pattern ensures developers **cannot accidentally misuse** services and always have clear intent about authentication.

**Pros**:
- Managed identity (secure) for SDK operations in production
- Connection string optional (not forced on all applications)
- Clear separation of concerns
- Supports all scenarios: managed-identity-only, local dev, production with client uploads
- Consumer can opt-in to client-upload functionality

**Cons**:
- Requires both account name and connection string for the complete feature set
- More config to manage (but clearly documented)
- Framework needs to expose connection string for signing helpers

**Verdict**: Chosen as best balance of security and flexibility

## Decision Outcome

### Architecture Pattern

The Cellix framework provides `@cellix/service-blob-storage` with a dual-auth strategy:

```typescript
// Mode 1: Managed Identity Only (secure, no client uploads)
const blobService = new ServiceBlobStorage({
  accountName: 'myaccount',
});
// SDK uses managed identity (DefaultAzureCredential)
// No SAS signing capability

// Mode 2: Connection String for Local Dev (Azurite)
const blobService = new ServiceBlobStorage({
  connectionString: 'DefaultEndpointsProtocol=http://...azurite',
});
// SDK uses shared-key auth
// SAS signing available

// Mode 3: Production with Client Uploads (managed identity + separate SAS signing)
const blobService = new ServiceBlobStorage({
  accountName: 'myaccount',
});
// SDK uses managed identity
// Signing helpers receive connection string separately from app config
```

### Consumer Application (@ocom/service-blob-storage)

Applications that support client uploads explicitly register both config values and pass them differently:

```typescript
// Configuration layer (@apps/api)
const storageAccountName = process.env['AZURE_STORAGE_ACCOUNT_NAME'];
const storageConnectionString = process.env['AZURE_STORAGE_CONNECTION_STRING'];

if (!storageConnectionString) {
  throw new Error('Missing AZURE_STORAGE_CONNECTION_STRING for SAS signing');
}
if (!storageAccountName) {
  throw new Error('Missing AZURE_STORAGE_ACCOUNT_NAME for blob operations');
}

// Service registration (@ocom/service-blob-storage)
const frameworkService = new ServiceBlobStorage({
  accountName: storageAccountName,
  // connectionString NOT passed to framework service
  // SDK will use managed identity
});

// For client uploads, use connection string separately for signing
const sasGenerator = new ServiceBlobStorage({
  connectionString: storageConnectionString,
});
```

### Environment Configuration

**Local Development** (Azurite):
```bash
AZURE_STORAGE_ACCOUNT_NAME=devstoreaccount1
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=http://127.0.0.1:10000/devstoreaccount1;AccountName=devstoreaccount1;...
```

**Production** (Azure with Managed Identity):
```bash
AZURE_STORAGE_ACCOUNT_NAME=prodaccount
AZURE_STORAGE_CONNECTION_STRING=BlobEndpoint=https://prodaccount.blob.core.windows.net/;SharedAccessSignature=sv=...
# OR for shared-key auth
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https://...AccountName=prodaccount;AccountKey=...
```

The framework SDK uses managed identity automatically. Connection string is available to signing helpers only.

### Infrastructure as Code (Bicep)

Generic templates auto-inject `AZURE_STORAGE_ACCOUNT_NAME`:

```bicep
param applicationStorageAccountName string

// Function app module
module functionApp 'app-module.bicep' = {
  params: {
    appSettings: {
      AZURE_STORAGE_ACCOUNT_NAME: applicationStorageAccountName
      // AZURE_STORAGE_CONNECTION_STRING: managed separately
    }
  }
}
```

Downstream applications override templates and wire both values. This keeps the generic template flexible.

## Implementation Details

### Canonical SharedKey Authorization Headers (Preferred for Client Uploads)

The framework implements **canonical SharedKey authorization headers** per the [Azure Storage Services REST API Authorization specification](https://learn.microsoft.com/en-us/rest/api/storageservices/authorize-with-shared-key). This approach provides cryptographic metadata-locking to prevent replay attacks.

#### How It Works

The server signs a request on behalf of the client by creating a canonical string containing:

```
HttpMethod (PUT or GET)
Content-Encoding (empty if not present)
Content-Language (empty if not present)
Content-Length (locked in signature - different sizes produce different signatures)
Content-MD5 (empty if not present)
Content-Type (locked in signature - different MIME types produce different signatures)
Date
If-Modified-Since (empty if not present)
If-Match (empty if not present)
If-None-Match (empty if not present)
If-Unmodified-Since (empty if not present)
Range (empty if not present)
CanonicalizedHeaders (x-ms-* headers in sorted order, with values locked in)
CanonicalizedResource (/accountName/containerName/blobName)
```

The server then:
1. Base64-decodes the storage account's shared key
2. Computes HMAC-SHA256 of the canonical string
3. Base64-encodes the signature
4. Returns `SharedKey accountName:signature` to the client

The client includes this header in the PUT request: `Authorization: SharedKey accountName:signature`

Azure Storage validates by:
1. Reconstructing the canonical string from the request
2. Recomputing HMAC-SHA256 with the stored account key
3. Comparing signatures (must match exactly)

#### Metadata-Locking Security

The signature cryptographically binds the authorization to specific blob metadata. If ANY of these change, the signature becomes invalid:

| Metadata Component | Included in Signature | Replay Attack Scenario | Protection |
|---|---|---|---|
| HTTP Method | Line 1 (PUT/GET) | Use write auth for read | ✓ Different method → different signature |
| Blob Name | Canonicalized resource | Use auth for different blob | ✓ Different path → different signature |
| Container Name | Canonicalized resource | Upload to different container | ✓ Different path → different signature |
| Content-Length | Canonical string line 4 | Upload different file size | ✓ Different length → different signature |
| Content-Type | Canonical string line 6 | Upload wrong MIME type | ✓ Different type → different signature |
| Custom Metadata (x-ms-meta-*) | Canonicalized headers | Tamper with metadata headers | ✓ Different metadata → different signature |
| Account/Key | HMAC-SHA256 key | Forge signature | ✓ Cryptographically impossible (HMAC) |

**Server-Side Verification**: If a client attempts to upload with metadata that doesn't match the signed header, the server recalculates the canonical string using the actual request headers. The signatures won't match, and Azure Storage rejects the request with **403 Forbidden** (authentication failed).

#### Implementation in Framework

The framework provides `AuthHeaderGenerator` to create canonical auth headers:

```typescript
export interface CreateBlobAuthorizationHeaderRequest {
  containerName: string;
  blobName: string;
  contentLength: number;
  contentType: string;
  metadata?: Record<string, string>;  // Optional x-ms-meta-* headers
}

export interface BlobUploadAuthorizationHeader {
  authorizationHeader: string;  // "SharedKey accountName:signature"
  contentType: string;
  contentLength: number;
}

// Server generates auth header for client
const authHeader = await clientUploadSigner.createBlobWriteAuthorizationHeader({
  containerName: 'user-uploads',
  blobName: 'avatars/user-123.jpg',
  contentLength: 102400,
  contentType: 'image/jpeg',
  metadata: { 'userId': 'user-123', 'source': 'mobile-app' }
});

// Client uses the header in PUT request
fetch('https://account.blob.core.windows.net/user-uploads/avatars/user-123.jpg', {
  method: 'PUT',
  headers: {
    'Authorization': authHeader.authorizationHeader,  // "SharedKey account:signature"
    'Content-Type': 'image/jpeg',
    'Content-Length': '102400',
    'x-ms-meta-userId': 'user-123',
    'x-ms-meta-source': 'mobile-app',
    'x-ms-date': 'Mon, 18 May 2026 12:34:56 GMT'
  },
  body: fileBlob
});
```

#### Why Canonical Auth Headers Instead of SAS Tokens?

| Aspect | SAS Tokens | Canonical Auth Headers |
|---|---|---|
| **Time Enforcement** | ✓ Expiration checked by server | ✓ Expiration checked by server |
| **Permissions Scoping** | ✓ Read, Write, Delete granular | ✓ HTTP method (PUT/GET) granular |
| **Container Scoping** | ✓ Can be limited to container | ✓ Blob-specific in signature |
| **Blob-Name Binding** | ✗ SAS URL includes blob name, but policy doesn't bind to it | ✓ Blob name in canonicalized resource (signature fails if changed) |
| **Metadata Binding** | ✗ No protection | ✓ Content-Length, Content-Type, x-ms-* in signature |
| **File-Size Protection** | ✗ No (server must validate) | ✓ Content-Length in canonical string |
| **File-Type Protection** | ✗ No (server must validate) | ✓ Content-Type in canonical string |
| **Cryptographic Guarantee** | ✗ Policy-based (can be bypassed if server doesn't validate) | ✓ Signature mismatch = cryptographic proof of tampering |
| **Replay Across Blobs** | Possible (requires server validation) | Impossible (different blob = different signature) |

**Recommendation**: Use canonical auth headers for security-critical client uploads. Use SAS tokens (optional, via `generateReadSasToken()`) for read-only file viewing (lower sensitivity).

#### Why Connection Strings Are Required: Security Trade-offs

Connection strings (containing shared keys) are **not ideal** — storing secrets in environment variables is generally a security anti-pattern. However, for client uploads on Azure Blob Storage, canonical SharedKey signatures are **the best security option available**, and they require access to the shared account key.

**All Client Upload Options Available on Azure Storage REST API:**

| Option | Mechanism | Security Posture | Metadata Binding | Drawback |
|---|---|---|---|---|
| **1. Shared Key Signatures (Chosen)** | HMAC-SHA256 of canonical string including blob path, metadata, HTTP method | ✓✓✓ Cryptographic, metadata-locked, replay-proof | ✓ Full (path, size, type, metadata) | Requires AccountKey in connection string |
| **2. SAS Tokens (Time-Based)** | Time-expiration + permissions (Read/Write/Delete) policy | ✓ Time-limited, but weak on metadata | ✗ None (server must validate) | Replay possible across blobs; server-side validation required |
| **3. User Delegation Key (SAS)** | Azure AD user delegation for SAS token generation | ✓ Azure AD audit trail | ✗ None (permission-based only) | Complex setup; requires advanced Azure AD config; still no metadata binding |
| **4. Managed Identity with SDK** | DefaultAzureCredential + BlobClient | ✓✓ No secrets, audit trail via RBAC | ✓ Implicit (server-side SDK validation) | Client cannot upload directly (requires server upload endpoint) |
| **5. Temporary Access Keys** | Generate temporary keys via Azure SDK | ✓ Temporary, narrowly scoped | ✗ Manual server-side validation needed | Requires server to store and validate; added complexity |
| **6. No Pre-Auth (Open Uploads)** | Client uploads directly to container | ✗ Completely open (anyone can upload anything) | ✗ None | Security nightmare; completely unacceptable |

**Why Shared Key Signatures Win:**

Only **Shared Key Signatures** (option 1) provide:
- ✓ **Cryptographic replay-attack prevention**: Different blob = mathematically different signature (impossible to forge without the key)
- ✓ **Metadata-locked authorization**: File size, type, custom metadata bound in signature (client cannot upload different metadata)
- ✓ **No server-side validation required**: Signature verification failure is cryptographic proof (Azure Storage rejects with 403)
- ✓ **Standards-based**: Microsoft Azure Storage REST API standard (not a workaround)

**Why Connection Strings Are Acceptable Here:**

1. **Narrow Scoping**: Connection string is used **only for signing** (`AuthHeaderGenerator`), never passed through application code or used for SDK operations
2. **Isolated Usage**: SDK operations use managed identity (no connection string exposure in most of the codebase)
3. **Limited Attack Surface**: 
   - Application code cannot accidentally use the key for wrong operations (framework enforces separation)
   - Key exposure would only allow **signing** new uploads (not downloading, listing, deleting existing data)
   - Attacker would need both the connection string AND the ability to craft valid metadata headers
4. **No Better Alternative**: Every other option either:
   - Requires server-side validation (adds complexity, reduces cryptographic guarantee)
   - Doesn't provide metadata binding (allows replay attacks)
   - Is more operationally complex (User Delegation Key, temporary keys)
5. **Environment Variable as Necessary Evil**: 
   - Connection string stored in secret management (Azure Key Vault, deployment secrets)
   - Never committed to code (`.gitignore` enforces this)
   - Rotatable by infrastructure team (standard Azure rotation procedures)
   - Least-privilege RBAC ensures only Function App can access it

**The Principle**: We accept the narrow exposure of storing the shared key in connection string **because** the canonical SharedKey authorization header approach is **objectively the best security solution available** for client-side blob uploads on Azure Storage. The alternative would be weaker security with more server-side validation burden, or more operational complexity.


**AuthMode Determination**:
```typescript
function determineAuthMode(options: ServiceBlobStorageOptions): 'connectionString' | 'managedIdentity' {
  // When both provided, connectionString takes precedence (for local dev)
  if (options.connectionString) {
    return 'connectionString';
  }
  if (options.accountName) {
    return 'managedIdentity';
  }
  throw new Error('Either connectionString or accountName must be provided');
}
```

**SDK Client Construction**:
- **Managed Identity mode**: Uses `DefaultAzureCredential` and account name to build service URL
- **Connection String mode**: Parses connection string for credentials and blob endpoint
- **Azurite auto-detection**: Connection string containing `UseDevelopmentStorage=true` automatically uses localhost

**SAS Signing**:
- Only available when `connectionString` provided
- Internally uses `StorageSharedKeyCredential` to sign URLs
- Methods throw clear error if signing attempted without connection string

### Framework Service: Flexible Consumer Patterns

The framework `@cellix/service-blob-storage` is designed to support different application needs:

#### Pattern A: Managed Identity Only (No Client Uploads)

```typescript
// Application only needs server-side blob operations
const blobService = new ServiceBlobStorage({
  accountName: 'myaccount',  // Required for URL construction
  // NO connectionString provided
});

await blobService.startUp(); // Uses managed identity

const blobs = await blobService.listBlobs('my-container');
await blobService.uploadText('my-container', 'file.txt', 'content');

// createUploadUrl() would throw: "SAS signing not configured"
```

**Environment Variables**:
```bash
AZURE_STORAGE_ACCOUNT_NAME=myaccount
# AZURE_STORAGE_CONNECTION_STRING not required
```

**Rationale**: Applications that handle all uploads server-side and never need client-generated SAS URLs. No credentials required beyond managed identity. Simpler deployment, fewer env vars.

#### Pattern B: Local Development with Azurite

```typescript
// Framework automatically detects Azurite
const blobService = new ServiceBlobStorage({
  connectionString: 'DefaultEndpointsProtocol=http://127.0.0.1:10000/devstoreaccount1;...',
});

await blobService.startUp(); // Uses connection string, detects Azurite

// Both blob ops AND SAS signing work locally
const uploadUrl = await blobService.createUploadUrl(...);
```

**Environment Variables**:
```bash
AZURE_STORAGE_ACCOUNT_NAME=devstoreaccount1
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=http://...
```

**Rationale**: Connection string mode works for Azurite emulation, sharing the same code path as production signing.

#### Pattern C: Managed Identity + Optional SAS Signing (Recommended for Production)

```typescript
// Application needs both server ops AND client upload SAS signing
const sdkService = new ServiceBlobStorage({
  accountName: 'prodaccount',  // SDK uses managed identity
});

// Separate service for signing
const signingService = new ServiceBlobStorage({
  connectionString: process.env['AZURE_STORAGE_CONNECTION_STRING'],  // Only for signing
});

await sdkService.startUp();
await signingService.startUp();

// Server operations use managed identity
await sdkService.listBlobs('container');

// SAS signing uses connection string
const uploadUrl = await signingService.createUploadUrl(...);
```

**Environment Variables**:
```bash
AZURE_STORAGE_ACCOUNT_NAME=prodaccount
AZURE_STORAGE_CONNECTION_STRING=SharedAccessSignature=sv=...  # Or shared-key format
```

**Rationale**: Production best practice. Managed identity for SDK (auditable, no credential exposure). Connection string isolated to signing helpers only (narrow usage scope).

### OCOM Adapter (@ocom/service-blob-storage)

The OCOM adapter implements **Pattern C (recommended)** internally using a dual-service approach:

**ServiceBlobStorage Constructor**:
- Accepts `accountName` (required for managed identity SDK operations)
- Accepts optional `connectionString` (for opt-in SAS signing feature)
- Accepts optional `frameworkService` (for testing/injection)
- Validates that either `accountName` or `frameworkService` is provided

**Dual-Service Architecture**:
```typescript
constructor(options: ServiceBlobStorageOptions) {
  // Always create SDK service (managed identity)
  this.sdkService = new CellixServiceBlobStorage({
    accountName: options.accountName,
    // NO connectionString here! Uses managed identity
  });

  // Conditionally create SAS signing service
  if (options.connectionString) {
    this.sasSigningService = new CellixServiceBlobStorage({
      connectionString: options.connectionString,
      // Isolated for signing only
    });
  }
}
```

**Behavior**:
- **Blob operations** (list, upload, delete): Always use SDK service (managed identity)
- **SAS URL generation** (createUploadUrl, createReadUrl): Use signing service if available, throw clear error if not

**Options Precedence**:
```typescript
export interface ServiceBlobStorageOptions {
  accountName?: string;  // For managed identity + URL construction
  connectionString?: string;  // For SAS signing (opt-in)
  frameworkService?: BlobStorage;  // For testing/injection
}
```

**Why Dual-Service Architecture?**

Each service has a single, clear responsibility:
- **SDK Service**: All blob operations via managed identity (secure, auditable)
- **SAS Signing Service**: Generate signed URLs (isolated, optional)

Benefits:
- No confusion about which auth is used where
- Each service can be mocked independently in tests
- Optional feature (no signing service if connectionString not provided)
- Application code is self-documenting (shows exact intent)

### Configuration Validation (@apps/api)

```typescript
// Validate both are present (this application requires both)
if (!storageConnectionString) {
  throw new Error(
    'Missing AZURE_STORAGE_CONNECTION_STRING. Required for client upload SAS signing (all environments).'
  );
}
if (!storageAccountName) {
  throw new Error(
    'Missing AZURE_STORAGE_ACCOUNT_NAME. Required for blob URL construction (all environments).'
  );
}

// Comments clarify the architecture
export const blobStorageConfig = {
  // Account name used for blob URL construction in all environments
  accountName: storageAccountName,
  // Connection string used for SAS token generation in all environments
  // (client uploads feature). SDK auth uses managed identity.
  connectionString: storageConnectionString,
};
```

## Consequences

### Positive Consequences

1. **Production security (managed identity)**: Backend blob operations use managed identity (no credentials in code)
2. **Replay attack prevention (metadata-locked auth headers)**: Canonical SharedKey headers lock blob identity, content-length, content-type, and custom metadata in the signature; different blobs produce mathematically different signatures; replay attacks are cryptographically impossible (not just policy-enforced)
3. **Client uploads with security**: Clients can upload to signed authorization headers without storage credentials
4. **Local development support**: Azurite works seamlessly with connection strings
5. **Flexible opt-in**: Applications without client uploads only provide `accountName`
6. **Clear architecture**: Separation between SDK auth (managed identity) and header signing (shared-key)
7. **Portable pattern**: Framework works across scenarios; applications can choose their deployment model
8. **No credential exposure**: Connection strings never leak through application code (only used for signing helpers)
9. **Self-documenting config**: Env var comments explain why each value is needed
10. **IaC flexibility**: Generic templates don't force every app to provide both env vars
11. **Metadata binding in signature**: File characteristics (size, type) bound cryptographically; server doesn't need to validate separately

### Neutral Consequences

1. **Two env vars required for full feature set**: Acceptable because they serve different purposes (clear in docs)
2. **Framework precedence rule**: Connection string takes precedence when both provided (documented in JSDoc)
3. **Test complexity slightly increased**: Must mock both auth paths (worth the security verification)
4. **Canonical string building**: More complex than simple SAS tokens, but provides cryptographic guarantees

### Negative Consequences

1. **Applications wanting managed-identity-only still receive connection string config** (inherited from app defaults)
   - Mitigated by making `connectionString` optional in framework options
   - Consumer can choose not to use client uploads and not require the env var
2. **Some deployment scenarios require connection string format knowledge** (parsing connection strings)
   - Mitigated by clear error messages and documentation
3. **Auth headers without connection string fails at runtime** (not compile-time)
   - Mitigated by clear error messages; good fit for optional feature
4. **Canonical string format is strict**: Must match Azure Storage specification exactly
   - Mitigated by comprehensive tests verifying against Azure specification and integration tests with Azurite


## Validation

### Local Development

```bash
# Start Azurite
azurite-blob --silent --blobPort 10000

# Set env vars
export AZURE_STORAGE_ACCOUNT_NAME=devstoreaccount1
export AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=http://127.0.0.1:10000/devstoreaccount1;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OtQ3Q7AeFFS=;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1/"

# Run tests (should pass against Azurite)
pnpm --filter @cellix/service-blob-storage run test
pnpm --filter @ocom/service-blob-storage run test
```

### Production (Azure)

1. **Enable managed identity**: Assign Managed Identity to Function App
2. **Grant RBAC**: Storage Blob Data Contributor role on storage account
3. **Set env vars**: `AZURE_STORAGE_ACCOUNT_NAME` and `AZURE_STORAGE_CONNECTION_STRING` (for signing)
4. **Deploy**: Framework SDK will use managed identity automatically
5. **Verify logs**: Azure Monitor should show calls authenticated via managed identity

### Opt-In Client Uploads

Applications that need client uploads:
1. Require both env vars in config validation
2. Pass `accountName` to framework service (SDK uses managed identity)
3. Use connection string separately for signing helpers
4. Tests verify both modes work (managed identity, connection string)

Applications that don't need client uploads:
1. Can provide only `accountName`
2. Skip `connectionString` requirement in config
3. Framework service works (SAS methods throw if called)

## Related Decisions and Patterns

### ADRs

- **0014-azure-infrastructure-deployments.md**: Bicep templates, managed identity assignment
- **0022-snyk-security-integration.md**: Security scanning includes connection string secret management
- **0011-bicep.md**: IaC patterns for app settings injection

### Related Services

- **@cellix/service-blob-storage**: Framework-level blob storage with dual-auth support
- **@ocom/service-blob-storage**: Application adapter for client uploads via SAS
- **@ocom/application-services**: Uses blob storage adapter for member avatars, community documents

## Migration and Deprecation

### From Connection-String-Only

If an older deployment uses connection string everywhere:

1. Deploy managed identity assignment (RBAC)
2. Update SDK to use `accountName` instead of `connectionString` for SDK client
3. Keep `connectionString` for signing
4. Tests verify managed identity path works
5. Monitor logs to confirm managed identity is in use

### From Shared-Key-Only

If migrating from explicit shared-key auth:

1. Switch to managed identity for SDK (`accountName` + `DefaultAzureCredential`)
2. Keep connection string for signing only
3. No changes to client-upload code (still uses SAS signing)
4. RBAC replaces shared-key for audit/compliance

## Future Considerations

1. **User Delegation Keys**: For pure Azure AD scenarios (no shared keys), could implement SAS signing via User Delegation Key (more complex)
2. **Direct Identity SAS**: Azure SDK support for signing SAS URLs with DefaultAzureCredential (when available)
3. **Broader framework adoption**: Other infrastructure services (e.g., Queue, Table) can follow same dual-auth pattern
4. **Audit and compliance**: Logging managed identity usage vs. shared-key in Azure Monitor for compliance reporting

## References

### Azure Storage Documentation
- [Azure Storage Services REST API Authorization](https://learn.microsoft.com/en-us/rest/api/storageservices/authorize-with-shared-key) - Canonical string specification and HMAC-SHA256 signing
- [Azure Blob Storage authentication](https://learn.microsoft.com/en-us/azure/storage/blobs/authorize-access-azure-blob-storage)
- [Managed Identity best practices](https://learn.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview)
- [SAS token generation](https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview) (for read-only file viewing)
- [Azurite emulation](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azurite)
- [Azure SDK DefaultAzureCredential](https://learn.microsoft.com/en-us/javascript/api/%40azure/identity/defaultazurecredential)

### Implementation

#### Framework Implementation (@cellix/service-blob-storage)
- **AuthHeaderGenerator** (`src/auth-header-generator.ts`): HMAC-SHA256 signature generation with canonical string building per Azure spec
- **ClientUploadSigner** (`src/client-upload-signer.ts`): Public API for creating canonical SharedKey auth headers (`createBlobWriteAuthorizationHeader`, `createBlobReadAuthorizationHeader`)
- **ServiceBlobStorage** (`src/service-blob-storage.ts`): Dual-auth framework service supporting both managed identity (SDK) and SharedKey (signing)
- **Interfaces** (`src/interfaces.ts`): Type definitions for auth header requests and responses

#### Security Test Suite
- **client-upload-signer.auth-header.test.ts**: 
  - 12 tests for auth header generation and deterministic signatures
  - **7 security tests** (metadata-locking scenarios):
    - Different blob names → different signatures
    - Different containers → different signatures
    - Different content-length → different signatures
    - Different content-type → different signatures
    - Different metadata values → different signatures
    - Different HTTP methods → different signatures
    - Content-length mismatch detection
  - All tests verify cryptographic security properties per Azure spec

#### Application Integration (@ocom/service-blob-storage)
- **ClientUploadService**: Adapter implementing narrower interface for type-safe client uploads
- **blob-storage.contract.ts**: OCOM-specific contract defining what consumers should depend on
