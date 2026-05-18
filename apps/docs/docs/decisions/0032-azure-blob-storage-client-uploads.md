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

# Azure Blob Storage with Managed Identity & Signed SAS URLs for Secure Client Uploads

## Context and Problem Statement

Applications need to:

1. **Store and retrieve binary assets securely** (e.g., member avatars, community documents)
2. **Enable client-side uploads** without exposing storage credentials or allowing uncontrolled blob creation
3. **Maintain production-grade security** using Azure best practices (managed identity, no shared keys in code)
4. **Support local development** (Azurite emulation) and production deployments with the same code
5. **Decouple authentication strategy** (managed identity) from client-upload signing requirements (SAS shared-key)

### The Challenge

Azure Blob Storage supports multiple authentication approaches:

- **Shared Key (connection string)**: Simple for development, but credentials in env vars; not recommended for production
- **Managed Identity (DefaultAzureCredential)**: Production best practice on Azure, no credentials to leak, but doesn't provide SAS signing for clients
- **Service Principal/SAS tokens**: More control, but adds credential management complexity

Client uploads specifically require signed SAS URLs with embedded constraints (container, blob name, expiration, permissions). SAS signing can only be done with:
- **Shared Key credentials** (AccountName + AccountKey), or
- **User Delegation Key** (only for Azure AD-authenticated clients)

For Cellix applications, the pattern is:
- Backend blob operations (read/write/delete) → use **managed identity** (secure, auditable)
- Client uploads → require **signed SAS URLs** → need shared-key credentials to sign
- Server handles both paths, using managed identity for backend and shared keys only for client-upload signing

### Prior Attempts

Earlier iterations tried to:
1. Always use connection strings for everything (insecure in production, config forced it everywhere)
2. Use a single auth strategy everywhere (rigid, prevented managed identity even when client uploads weren't needed)

This ADR establishes the pattern: **managed identity for SDK operations + optional shared-key signing for client uploads**.

## Decision Drivers

- **Production security best practice**: Managed identity (no credentials in code/environment)
- **Local development support**: Azurite with connection string must work
- **Flexible opt-in**: Not all applications need client uploads; connection string should be optional
- **Clear architecture**: Separate concerns (SDK auth from SAS signing)
- **No credential exposure**: Never pass credentials through application code
- **Framework reusability**: Service should support both scenarios: managed-identity-only and managed-identity + client uploads

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

### Framework Service (@cellix/service-blob-storage)

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
2. **Client uploads with security (SAS signing)**: Clients can upload to scoped, time-limited URLs without storage credentials
3. **Local development support**: Azurite works seamlessly with connection strings
4. **Flexible opt-in**: Applications without client uploads only provide `accountName`
5. **Clear architecture**: Separation between SDK auth (managed identity) and signing (shared-key)
6. **Portable pattern**: Framework works across scenarios; applications can choose their deployment model
7. **No credential exposure**: Connection strings never leak through application code (only used for signing helpers)
8. **Self-documenting config**: Env var comments explain why each value is needed
9. **IaC flexibility**: Generic templates don't force every app to provide both env vars

### Neutral Consequences

1. **Two env vars required for full feature set**: Acceptable because they serve different purposes (clear in docs)
2. **Framework precedence rule**: Connection string takes precedence when both provided (documented in JSDoc)
3. **Test complexity slightly increased**: Must mock both auth paths (worth the safety verification)

### Negative Consequences

1. **Applications wanting managed-identity-only still receive connection string config** (inherited from app defaults)
   - Mitigated by making `connectionString` optional in framework options
   - Consumer can choose not to use client uploads and not require the env var
2. **Some deployment scenarios require connection string format knowledge** (parsing connection strings)
   - Mitigated by clear error messages and documentation
3. **Signing without connection string fails at runtime** (not compile-time)
   - Mitigated by clear error messages; good fit for optional feature

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

1. Deploy managed identity identity assignment (RBAC)
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

- [Azure Blob Storage authentication](https://learn.microsoft.com/en-us/azure/storage/blobs/authorize-access-azure-blob-storage)
- [Managed Identity best practices](https://learn.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview)
- [SAS token generation](https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview)
- [Azurite emulation](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azurite)
- [Azure SDK DefaultAzureCredential](https://learn.microsoft.com/en-us/javascript/api/%40azure/identity/defaultazurecredential)
