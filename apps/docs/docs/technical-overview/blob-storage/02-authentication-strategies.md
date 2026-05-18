---
sidebar_position: 2
title: "Authentication Strategies"
description: "Understanding managed identity, shared keys, and why each is used"
---

# Authentication Strategies

The Cellix blob storage service uses different authentication methods for different purposes. Understanding why is critical to using the framework correctly.

## Why Dual Authentication?

| Purpose | Auth Method | Why? |
|---|---|---|
| **Backend SDK operations** | Managed Identity | Production best practice: no credentials in code, auditable via RBAC |
| **Client upload signing** | Shared Key Credentials | Only method that provides metadata-locked, replay-proof authorization |
| **Read-only file access** | SAS Tokens (MI-backed) | Time-limited access without credentials |

## Option 1: Managed Identity (Backend Operations)

**What it is**: Azure AD-based authentication using the application's system-assigned identity.

**Security properties**:
- ✓ No secrets in code or environment variables
- ✓ Fully auditable (Azure logs every operation under specific identity)
- ✓ Can be revoked instantly (remove RBAC role)
- ✓ Automatic token refresh (handled by SDK)

**How it works**:
```typescript
// Framework automatically uses DefaultAzureCredential when no connection string provided
const blobService = new ServiceBlobStorage({
  accountName: 'myaccount',
  // NO connectionString = uses managed identity
});

await blobService.startUp(); // SDK creates BlobServiceClient with DefaultAzureCredential

// All operations authenticated via managed identity
await blobService.listBlobs('my-container');
await blobService.uploadText('my-container', 'file.txt', 'content');
```

**Setup required**:
1. Assign Managed Identity to your Function App / App Service
2. Grant role "Storage Blob Data Contributor" on storage account
3. Set `AZURE_STORAGE_ACCOUNT_NAME` env var (no connection string needed)

**Best for**: All backend operations, especially in production.

## Option 2: Connection Strings (Client Upload Signing)

**What it is**: Shared key credentials for signing authorization headers.

**Security properties**:
- ✗ Secrets in environment variables (anti-pattern)
- ✓ BUT: Used **only for signing**, never passed through application code
- ✓ Used **only for client uploads**, not for SDK operations
- ✓ Attack surface limited (signing only; cannot list/delete/modify existing data)

**Why it's necessary**:

On Azure Storage REST API, **only SharedKey signatures provide metadata-locking** for client uploads. All other options lack cryptographic guarantees against replay attacks.

**All Client Upload Options on Azure:**

| Option | Mechanism | Replay Protection | Metadata Binding | Complexity | Drawback |
|---|---|---|---|---|---|
| **1. Shared Key Signatures** | HMAC-SHA256 of canonical string | ✓✓✓ Cryptographic (impossible) | ✓ Full (path, size, type, metadata) | Low | Requires AccountKey |
| **2. SAS Tokens** | Permission + time-expiration policy | ✓ Time-limited only | ✗ None (server validates) | Low | Server must validate metadata |
| **3. User Delegation Key** | Azure AD user delegation | ✓ Time-limited + audit trail | ✗ None (permission-based) | High | Complex Azure AD setup |
| **4. Temp Access Keys** | Generate via SDK | ✓ Temporary only | ✗ Manual server validation | Medium | Server stores + validates |
| **5. Managed Identity Upload** | Server upload endpoint | ✓ Implicit SDK validation | ✓ Implicit | Low | Client cannot upload directly |
| **6. Open Upload** | No authentication | ✗ None | ✗ None | None | Unacceptable |

### Why Shared Key Signatures Win

**Only option 1 provides:**
- ✓ **Cryptographic replay-attack prevention**: Different blob → mathematically different signature
- ✓ **Metadata-locked authorization**: File size, type, custom metadata bound in signature
- ✓ **No server-side validation required**: Signature mismatch = cryptographic proof (Azure rejects with 403)
- ✓ **Standards-based**: Microsoft Azure Storage REST API standard

**Trade-off accepted**: We accept connection string exposure (narrow scope) because SharedKey auth headers are objectively the best security available for client uploads.

## Option 3: SAS Tokens (Read Access)

**What it is**: Time-limited, permission-scoped access tokens for public file sharing.

**Security properties**:
- ✓ Time-expiration enforced by server
- ✓ Permission-scoped (Read only, cannot write/delete)
- ✗ No metadata binding (but acceptable for read-only)

**How it works**:
```typescript
// SAS token generated via managed identity credentials
const sasToken = await blobService.generateReadSasToken({
  containerName: 'public-files',
  blobName: 'document.pdf',
  expiresIn: 3600, // 1 hour
});

// Client receives just the query string, constructs full URL
const readUrl = `https://account.blob.core.windows.net/public-files/document.pdf?${sasToken}`;
```

**Best for**: Read-only file sharing, document viewing, temporary public access.

## Configuration Reference

### Backend Only (No Client Uploads)

```typescript
// Bootstrap
const blobService = new ServiceBlobStorage({
  accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
  // NO connectionString
});

// Env vars
AZURE_STORAGE_ACCOUNT_NAME=myaccount

// Result
- ✓ Managed identity for all ops
- ✗ No client upload signing available
- ✓ Most secure (no secrets)
```

### Full Feature Set (Backend + Client Uploads + Read Access)

```typescript
// Bootstrap
const blobService = new ServiceBlobStorage({
  accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
});

// Env vars
AZURE_STORAGE_ACCOUNT_NAME=myaccount
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https://...AccountKey=...

// Result
- ✓ Managed identity for SDK operations
- ✓ Shared key for client upload signing (metadata-locked)
- ✓ SAS tokens for read access
- ✓ Full security: cryptographic replay protection + no secrets in code (narrow scoping)
```

## Local Development (Azurite)

```typescript
// Bootstrap (same code as production!)
const blobService = new ServiceBlobStorage({
  accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
});

// Env vars (connection string auto-detects Azurite)
AZURE_STORAGE_ACCOUNT_NAME=devstoreaccount1
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=http://127.0.0.1:10000/devstoreaccount1;AccountName=devstoreaccount1;AccountKey=...

// Result
- ✓ Both SDK and signing work (connection string mode)
- ✓ Same code path as production
- ✓ Perfect for development/testing
```

## Migration Patterns

### From SAS Tokens to Metadata-Locked Auth Headers

If currently using SAS tokens for client uploads:

1. **Add connection string** to config (if not already present)
2. **Update server-side signing** to use `createBlobWriteAuthorizationHeader()`
3. **Update client code** to use returned auth header instead of SAS URL
4. **Remove server-side validation** (no longer needed; signature verification is cryptographic)
5. **Test** to ensure replay attacks are now impossible

### From Shared Key SDK Operations to Managed Identity

If currently using connection string for SDK operations:

1. **Assign Managed Identity** to application
2. **Grant RBAC role** (Storage Blob Data Contributor)
3. **Update config** to use `accountName` only for SDK service
4. **Keep connection string** for client upload signing (separate service instance)
5. **Verify logs** that operations use managed identity (check Azure Monitor)

## Related Documentation

- [Client Uploads with Auth Headers](./client-uploads-with-auth-headers)
- [Canonical Auth Headers Security](./canonical-auth-headers)
- [Troubleshooting](./troubleshooting)
- [ADR-0032: Full Architecture Decision](/docs/decisions/azure-blob-storage-client-uploads)
