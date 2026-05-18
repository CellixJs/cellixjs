---
sidebar_position: 1
title: "Blob Storage Overview"
description: "Overview of Cellix blob storage service for managing binary assets securely"
---

# Blob Storage Overview

The `@cellix/service-blob-storage` framework service provides a robust, production-ready pattern for managing binary assets (images, documents, etc.) in Azure Blob Storage.

## What It Solves

Applications need to:
1. **Store and retrieve binary assets** securely (e.g., member avatars, community documents)
2. **Enable client-side uploads** without exposing storage credentials or allowing uncontrolled blob creation
3. **Prevent replay attacks** where clients attempt to upload different files using authorization meant for another
4. **Use production security best practices** (managed identity, no credentials in application code)
5. **Support local development** (Azurite emulation) seamlessly

## Core Capabilities

### Backend Operations (Managed Identity)
- List blobs in container
- Upload/download files
- Delete blobs
- Uses Azure managed identity (secure, auditable, no credentials)

### Client Uploads (Canonical SharedKey Authorization)
- Generate signed authorization headers for client uploads
- **Metadata-locked security**: Different files → different signatures (replay-proof)
- Client sends header to Azure Storage directly (no server proxy needed)
- Server validates via Azure Storage (signature verification)

### Read Access (Optional SAS Tokens)
- Generate time-limited read SAS tokens for file viewing
- Uses managed identity credentials
- Useful for public file sharing with expiration

## Architecture Pattern

The framework uses a **dual-authentication strategy**:

```
Backend Operations     Client Uploads            Read Access
─────────────────     ──────────────            ────────────
Managed Identity  +   SharedKey Auth Headers  + SAS Tokens (MI)
  (secure)            (metadata-locked)        (read-only)
```

**Why dual auth?**
- Managed identity for backend = production-secure (no credentials exposed)
- SharedKey auth headers for client uploads = cryptographic replay protection (best available)
- Each service has a single, clear responsibility
- Application code sees narrow interfaces (cannot misuse auth modes)

## Quick Start

### For Server-Only Uploads
```typescript
const blobService = new ServiceBlobStorage({
  accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
  // No connection string = managed identity only
});
await blobService.startUp();

// All uploads happen server-side
await blobService.uploadText('my-container', 'file.txt', 'content');
```

### For Client Uploads
```typescript
const blobService = new ServiceBlobStorage({
  accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
});
await blobService.startUp();

// Server generates secure auth header for client
const authHeader = await blobService.createBlobWriteAuthorizationHeader({
  containerName: 'uploads',
  blobName: 'user-avatar.jpg',
  contentLength: 102400,
  contentType: 'image/jpeg',
});

// Client receives "SharedKey accountName:signature" and uses it directly with Azure
// Different file? Different signature. Different size? Different signature. Replay-proof.
```

## Key Concepts

### Metadata-Locking
Authorization headers include the blob's metadata in the cryptographic signature:
- Blob path (container + name)
- File size (content-length)
- File type (content-type)
- Custom metadata (x-ms-meta-* headers)
- HTTP method (PUT vs GET)

If client attempts to upload different metadata than authorized, Azure Storage rejects it with 403 Forbidden.

### Connection String (Not Ideal, But Necessary)
Connection strings contain the storage account key and are not ideal (storing secrets in env vars is an anti-pattern). However, they're required for canonical SharedKey auth headers—the **best security option available** on Azure for client uploads. See [Security Trade-offs](./authentication-strategies#why-shared-key-signatures-win) for details.

## Configuration

| Scenario | accountName | connectionString | Best For |
|---|---|---|---|
| **Backend only** | ✓ Required | ✗ Not needed | Server-side uploads, no client uploads |
| **Local dev** | ✓ Required | ✓ Required | Azurite development with full feature set |
| **Production with client uploads** | ✓ Required | ✓ Required | Secure client uploads + server ops |

## Next Steps

- **[Authentication Strategies](./authentication-strategies)** — Deep dive on managed identity vs shared keys
- **[Client Uploads](./client-uploads-with-auth-headers)** — How to implement client-side uploads with metadata-locking
- **[Canonical Auth Headers](./canonical-auth-headers)** — Security deep-dive on cryptography and replay prevention
- **[Troubleshooting](./troubleshooting)** — Common configuration errors and solutions

## Related ADR

- [ADR-0032: Azure Blob Storage with Managed Identity & Canonical SharedKey Auth Headers](/docs/decisions/azure-blob-storage-client-uploads)
