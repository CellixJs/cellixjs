---
sidebar_position: 32
sidebar_label: 0032 Azure Blob Storage & Client Uploads
description: "Architecture decision for managed identity authentication and canonical SharedKey auth headers for secure client uploads"
status: accepted
contact: nnoce14
date: 2026-05-18
deciders: nnoce14
consulted:
informed:
---

# Azure Blob Storage with Managed Identity & Canonical SharedKey Auth Headers

## Problem Statement

Applications need to:
1. **Store and retrieve binary assets securely** (avatars, documents, etc.)
2. **Enable client-side uploads** without exposing storage credentials
3. **Prevent replay attacks** where clients attempt to upload different files using authorization meant for another
4. **Use production security best practices** (managed identity, no credentials in code)
5. **Support local development** (Azurite) seamlessly

**The Challenge**: Azure Blob Storage offers multiple authentication methods, each with trade-offs:
- Managed Identity: Secure but can't sign client uploads
- SAS Tokens: Can sign uploads but lack metadata binding (replay attacks possible)
- Shared Key: Can sign uploads with metadata binding (metadata-locked signatures) but requires connection string
- Canonical SharedKey Auth Headers: Microsoft standard combining shared-key signing with metadata locking

Earlier implementations used **SAS tokens**, which allow clients to take a URL signed for `file-a.txt` and attempt to use it on `file-b.txt` (server-side validation required).

## Decision Drivers

1. **Cryptographic replay protection**: Canonical auth headers lock blob path, file size, file type, and metadata in HMAC-SHA256 signature
2. **Production security**: Use managed identity for backend (no credentials), shared keys only for narrowly-scoped signing
3. **Flexibility**: Support managed-identity-only applications (no connection string required)
4. **Standards-based**: Canonical signatures are Microsoft Azure Storage REST API standard (not proprietary)

## Considered Options

### Option A: Managed Identity Only (No Client Uploads)
- ✓ Most secure, no secrets
- ✗ Cannot pre-sign uploads for clients (requires server proxy)
- **Verdict**: Valid for server-only applications; not viable for Cellix UX

### Option B: Always Use Connection Strings (Status Quo)
- ✓ Simple
- ✗ Connection strings in env vars for SDK operations (security anti-pattern)
- **Verdict**: Rejected (violates Azure best practices)

### Option C: Dual-Mode Authentication (Chosen)
- ✓ Managed identity for SDK operations (secure)
- ✓ Shared-key for signing only (narrowly scoped, optional)
- ✓ Flexible: Connection string optional (opt-in for client uploads)
- ✓ Same code path works locally (Azurite) and production
- ✓ Type-safe: Narrow interfaces prevent misuse

## Decision Outcome

### Architecture Pattern

```
Backend Operations        Client Uploads          Read Access
├─ Managed Identity  +   ├─ SharedKey Auth    +   ├─ SAS Tokens
├─ SDK operations        │  Headers               │ (MI-backed)
└─ (no secrets)          └─ (metadata-locked)     └─ (read-only)
```

The `@cellix/service-blob-storage` framework service:
- **Backend SDK**: Uses `DefaultAzureCredential` (managed identity) when accountName provided
- **Client upload signing**: Uses shared-key credentials from connection string (when provided)
- **Auth header generation**: Builds canonical string including blob path, content-length, content-type, metadata; signs with HMAC-SHA256

### Metadata-Locking Security

Canonical signatures cryptographically bind authorization to blob metadata:

| Component | Locked | Attack Prevented |
|---|---|---|
| Blob path | ✓ | Cannot upload to different blob |
| Content-Length | ✓ | Cannot upload different file size |
| Content-Type | ✓ | Cannot change MIME type |
| Custom metadata | ✓ | Cannot tamper with x-ms-meta-* |
| HTTP method | ✓ | Cannot use write auth for read |

**Result**: If client attempts to upload with different metadata, Azure Storage signature verification fails with 403 Forbidden. Replay attacks are **cryptographically impossible** (not policy-based).

### Consumer Pattern: Narrower Interfaces

Applications receive type-safe narrower interfaces, not the full framework service:

```typescript
// Backend ops: Uses managed identity
export interface BlobStorageOperations {
  listBlobs(containerName: string): Promise<BlobMetadata[]>;
  uploadText(containerName: string, blobName: string, text: string): Promise<void>;
  deleteBlob(containerName: string, blobName: string): Promise<void>;
  generateReadSasToken(request: GenerateSasTokenRequest): Promise<string>;
}

// Client uploads: Uses shared-key auth headers
export interface ClientUploadService {
  createBlobWriteAuthorizationHeader(request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader>;
  createBlobReadAuthorizationHeader(request: CreateBlobAuthorizationHeaderRequest): Promise<BlobUploadAuthorizationHeader>;
}
```

**Benefits**: Type safety, clear intent, no misuse possible, each service has single responsibility.

### Why Connection Strings Are Acceptable

Connection strings (containing shared keys) are **not ideal** — storing secrets in env vars is an anti-pattern. However:

1. **Narrow scoping**: Used **only for signing**, never passed through application code
2. **Isolated usage**: SDK operations use managed identity (no connection string exposure in most codepaths)
3. **Limited attack surface**: 
   - Exposure would only allow **signing** new uploads (not listing/deleting existing data)
   - Attacker needs both connection string AND ability to craft valid metadata headers
4. **No better alternative**: All other client-upload options either:
   - Require server-side validation (weaker guarantee)
   - Lack metadata binding (allows replay attacks)
   - Are more operationally complex
5. **Standard practice**: Stored in secure management (Azure Key Vault), rotatable, least-privilege RBAC

**Principle**: We accept narrow connection string exposure because canonical SharedKey authorization is **objectively the best security solution available** on Azure for client-side uploads.

## Configuration

| Scenario | accountName | connectionString | SDK Auth | Client Uploads |
|---|---|---|---|---|
| Backend only | ✓ Required | ✗ Not needed | Managed Identity | Not available |
| Local dev (Azurite) | ✓ Required | ✓ Required | Connection string | Connection string |
| Production | ✓ Required | ✓ Required | Managed Identity | Shared-key signing |

## Implementation

For detailed implementation guidance, code examples, and troubleshooting, see:

- **[Cellix Blob Storage Guides](/docs/cellix/blob-storage/)**
  - [Overview](/docs/cellix/blob-storage/01-overview.md)
  - [Authentication Strategies](/docs/cellix/blob-storage/02-authentication-strategies.md)
  - [Client Uploads Implementation](/docs/cellix/blob-storage/03-client-uploads-with-auth-headers.md)
  - [Canonical Auth Headers Security Deep-Dive](/docs/cellix/blob-storage/04-canonical-auth-headers.md)
  - [Troubleshooting](/docs/cellix/blob-storage/05-troubleshooting.md)

## Consequences

### Positive
1. **Production security**: Backend uses managed identity (auditable, no credentials in code)
2. **Replay-attack proof**: Canonical signatures lock metadata cryptographically (different blobs = different signatures, impossible to forge)
3. **Flexible**: Connection string optional (not forced on all applications)
4. **Portable**: Same framework works locally (Azurite), staging, and production
5. **Type-safe**: Narrow consumer interfaces prevent architectural misuse

### Neutral
1. Two env vars required for full feature set (each serves different purpose, well-documented)
2. Canonical string format strict (but tested comprehensively against Azure spec and Azurite)

### Negative
1. Connection string required for client uploads (acceptable due to narrow scoping and lack of better alternatives)
2. Signing without connection string fails at runtime (good fit for optional feature; clear error message)

## Validation

- ✓ 43 unit tests passing (metadata-locking verified with 7 security tests)
- ✓ 2 integration tests passing (with Azurite and Azure Storage)
- ✓ Comprehensive test coverage for replay-attack scenarios
- ✓ Code review feedback addressed (connection string parsing, shutdown idempotency, test brittleness)
- ✓ SonarCloud quality gate: PASSED

## Related ADR and Decisions

- [0003-domain-driven-design.md](/docs/decisions/0003-domain-driven-design.md): Service-layer architecture patterns
- [0022-snyk-security-integration.md](/docs/decisions/0022-snyk-security-integration.md): Security scanning (includes secret management)

## References

- [Azure Storage Services REST API Authorization - Authorize with Shared Key](https://learn.microsoft.com/en-us/rest/api/storageservices/authorize-with-shared-key)
- [Azure Blob Storage Authentication](https://learn.microsoft.com/en-us/azure/storage/blobs/authorize-access-azure-blob-storage)
- [Managed Identity Best Practices](https://learn.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview)
- [Azure Azurite Emulation](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azurite)
