---
sidebar_position: 3
title: "Client Uploads with Auth Headers"
description: "Implementing secure client-side uploads using metadata-locked authorization"
---

# Client Uploads with Canonical Authorization Headers

This guide covers how to implement secure client-side uploads using Cellix blob storage with metadata-locked canonical SharedKey authorization headers.

## Overview

**Traditional SAS URL approach:**
- Server generates SAS URL (time-limited, permission-scoped)
- Client uploads to URL
- Server must validate that client didn't change metadata (size, type, etc.)

**New Canonical Auth Header approach:**
- Server generates signed authorization header (metadata locked in signature)
- Client uploads with header directly to Azure
- Azure validates signature (metadata mismatch = 403 Forbidden)
- No server-side validation needed

**Benefit**: Replay attacks are cryptographically impossible (not policy-based).

## Server-Side: Generate Auth Headers

### Setup

```typescript
import { ServiceBlobStorage } from '@cellix/service-blob-storage';

// Bootstrap (requires accountName + connectionString)
const blobService = new ServiceBlobStorage({
  accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
});

await blobService.startUp();
```

### Generate Write Header (for upload)

```typescript
// User requests upload permission
const authHeader = await blobService.createBlobWriteAuthorizationHeader({
  containerName: 'user-uploads',
  blobName: `avatars/user-${userId}.jpg`,
  contentLength: 102400, // File size in bytes
  contentType: 'image/jpeg',
  metadata: {
    // Optional: custom metadata locked in signature
    userId: userId,
    uploadedAt: new Date().toISOString(),
    source: 'mobile-app',
  },
});

// Return to client
return {
  authorizationHeader: authHeader.authorizationHeader, // "SharedKey accountName:signature"
  blobUrl: `https://${accountName}.blob.core.windows.net/user-uploads/avatars/user-${userId}.jpg`,
  contentType: authHeader.contentType,
  contentLength: authHeader.contentLength,
};
```

### Generate Read Header (for direct file viewing)

```typescript
// Generate time-limited read access
const readSasToken = await blobService.generateReadSasToken({
  containerName: 'user-uploads',
  blobName: `avatars/user-${userId}.jpg`,
  expiresIn: 3600, // Seconds (1 hour)
});

// Return client-ready URL
return `https://${accountName}.blob.core.windows.net/user-uploads/avatars/user-${userId}.jpg?${readSasToken}`;
```

## Client-Side: Upload with Authorization Header

### Browser (Fetch API)

```typescript
// Request auth header from server
const uploadConfig = await fetch('/api/blob-upload-auth', {
  method: 'POST',
  body: JSON.stringify({
    fileName: 'avatar.jpg',
    fileSize: file.size,
    contentType: file.type,
  }),
}).then(r => r.json());

// Upload file with auth header
const response = await fetch(uploadConfig.blobUrl, {
  method: 'PUT',
  headers: {
    'Authorization': uploadConfig.authorizationHeader,
    'Content-Type': uploadConfig.contentType,
    'Content-Length': uploadConfig.contentLength.toString(),
    'x-ms-date': new Date().toUTCString(), // Must match server's date
    'x-ms-meta-userId': userId,
    'x-ms-meta-uploadedAt': new Date().toISOString(),
  },
  body: file,
});

if (!response.ok) {
  console.error('Upload failed:', response.status, response.statusText);
  // 403 = signature mismatch (metadata tampering detected)
  // 400 = invalid request
}
```

### Mobile (Native)

```swift
// iOS example using URLSession
var request = URLRequest(url: URL(string: uploadConfig.blobUrl)!)
request.httpMethod = "PUT"
request.setValue(uploadConfig.authorizationHeader, forHTTPHeaderField: "Authorization")
request.setValue(uploadConfig.contentType, forHTTPHeaderField: "Content-Type")
request.setValue("\(uploadConfig.contentLength)", forHTTPHeaderField: "Content-Length")
request.setValue(ISO8601DateFormatter().string(from: Date()), forHTTPHeaderField: "x-ms-date")

let task = URLSession.shared.uploadTask(with: request, from: fileData) { data, response, error in
    guard let httpResponse = response as? HTTPURLResponse else { return }
    if httpResponse.statusCode == 201 {
        print("Upload successful")
    } else if httpResponse.statusCode == 403 {
        print("Signature mismatch - metadata tampering detected")
    }
}
task.resume()
```

## Security Properties

### What's Protected

Each authorization header locks in specific metadata:

| Component | Locked | Attack Prevented |
|---|---|---|
| **Blob path** (container/name) | ✓ | Client cannot upload to different blob |
| **File size** (content-length) | ✓ | Client cannot upload different size |
| **File type** (content-type) | ✓ | Client cannot change MIME type |
| **Custom metadata** (x-ms-meta-*) | ✓ | Client cannot tamper with metadata headers |
| **HTTP method** (PUT/GET) | ✓ | Client cannot use write header for read |
| **Account key** (HMAC-SHA256) | ✓ | Client cannot forge signature |

### Attack Scenarios

| Scenario | Possible? | Why? |
|---|---|---|
| Client takes auth for user-a and uses on user-b | ✗ NO | Different blob path → different signature |
| Client takes auth for 1MB file and uploads 10MB | ✗ NO | Different content-length → signature fails |
| Client changes content-type without permission | ✗ NO | Different content-type → signature fails |
| Client tampers with metadata headers | ✗ NO | Different metadata → signature fails |
| Client replays auth header from earlier upload | ✓ POSSIBLE | (Expiration handled separately, use short TTL) |

## Configuration Examples

### Example 1: User Avatar Upload

```typescript
// Server endpoint: POST /api/avatar-upload-auth
export async function getAvatarUploadAuth(req: Request) {
  const userId = req.user.id;
  const { fileSize, contentType } = req.body;

  // Validate
  if (fileSize > 5 * 1024 * 1024) throw new Error('Max 5MB');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) {
    throw new Error('Invalid image type');
  }

  // Generate auth header
  const auth = await blobService.createBlobWriteAuthorizationHeader({
    containerName: 'avatars',
    blobName: `${userId}.jpg`,
    contentLength: fileSize,
    contentType,
    metadata: {
      userId,
      timestamp: new Date().toISOString(),
    },
  });

  return {
    authorizationHeader: auth.authorizationHeader,
    blobUrl: `https://${accountName}.blob.core.windows.net/avatars/${userId}.jpg`,
  };
}
```

### Example 2: Community Document Upload

```typescript
// Server endpoint: POST /api/community/:id/document-upload-auth
export async function getDocumentUploadAuth(req: Request) {
  const { communityId } = req.params;
  const { fileName, fileSize, contentType } = req.body;

  // Validate permissions
  const community = await Community.findById(communityId);
  if (!req.user.canUploadTo(community)) {
    throw new Error('Not authorized');
  }

  // Validate file
  if (fileSize > 50 * 1024 * 1024) throw new Error('Max 50MB');
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (!allowedTypes.includes(contentType)) {
    throw new Error('Invalid document type');
  }

  // Generate auth header
  const blobName = `communities/${communityId}/documents/${Date.now()}-${fileName}`;
  const auth = await blobService.createBlobWriteAuthorizationHeader({
    containerName: 'community-assets',
    blobName,
    contentLength: fileSize,
    contentType,
    metadata: {
      communityId,
      uploadedBy: req.user.id,
      originalFileName: fileName,
    },
  });

  return {
    authorizationHeader: auth.authorizationHeader,
    blobUrl: `https://${accountName}.blob.core.windows.net/community-assets/${blobName}`,
    blobName,
  };
}
```

## Testing

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { ServiceBlobStorage } from '@cellix/service-blob-storage';

describe('Client upload auth headers', () => {
  const blobService = new ServiceBlobStorage({
    accountName: 'testaccount',
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  });

  it('generates different signatures for different blob names', async () => {
    const auth1 = await blobService.createBlobWriteAuthorizationHeader({
      containerName: 'test',
      blobName: 'file-a.jpg',
      contentLength: 1000,
      contentType: 'image/jpeg',
    });

    const auth2 = await blobService.createBlobWriteAuthorizationHeader({
      containerName: 'test',
      blobName: 'file-b.jpg',
      contentLength: 1000,
      contentType: 'image/jpeg',
    });

    // Different blob names must produce different signatures
    expect(auth1.authorizationHeader).not.toBe(auth2.authorizationHeader);
  });

  it('generates different signatures for different content-length', async () => {
    const auth1 = await blobService.createBlobWriteAuthorizationHeader({
      containerName: 'test',
      blobName: 'file.jpg',
      contentLength: 1000,
      contentType: 'image/jpeg',
    });

    const auth2 = await blobService.createBlobWriteAuthorizationHeader({
      containerName: 'test',
      blobName: 'file.jpg',
      contentLength: 2000,
      contentType: 'image/jpeg',
    });

    // Different sizes must produce different signatures
    expect(auth1.authorizationHeader).not.toBe(auth2.authorizationHeader);
  });
});
```

## Common Issues

### "403 Forbidden" on Upload

Possible causes:
- Client sent different content-length than authorized
- Client sent different content-type than authorized
- Client sent different x-ms-meta-* headers than authorized
- Connection string/account key is invalid

**Debug**: Log the exact headers sent by client vs. what server authorized.

### "Empty Blob Created" but Upload Failed

This can happen if the request fails after Azure receives the headers but before the body. The blob is created with 0 bytes.

**Solution**: Always clean up 0-byte blobs in background job or validate in code.

### x-ms-date Header Mismatch

The `x-ms-date` header must be set during signature generation and match when client sends it.

**Note**: Azure allows ~15 minute clock skew; if client clock is very off, requests may fail.

## Related Documentation

- [Authentication Strategies](./authentication-strategies)
- [Canonical Auth Headers Security](./canonical-auth-headers)
- [Troubleshooting](./troubleshooting)
