---
sidebar_position: 4
title: "Canonical Auth Headers Security"
description: "Deep dive into how canonical SharedKey authorization provides replay-proof security"
---

# Canonical Authorization Headers: Security Deep Dive

This guide explains the cryptography, standards, and security guarantees behind canonical SharedKey authorization headers.

## Microsoft Azure Storage Standard

Cellix implements the **Azure Storage Services REST API Authorization** standard defined by Microsoft. See official documentation: [Authorize with Shared Key](https://learn.microsoft.com/en-us/rest/api/storageservices/authorize-with-shared-key)

This is **not a proprietary or experimental approach**—it's how Azure Storage itself verifies PUT requests from clients.

## How Canonical Strings Work

### Canonical String Structure

When you generate an authorization header, Cellix builds a **canonical string** containing:

```
[HTTP Method]
[Content-Encoding]
[Content-Language]
[Content-Length]
[Content-MD5]
[Content-Type]
[Date]
[If-Modified-Since]
[If-Match]
[If-None-Match]
[If-Unmodified-Since]
[Range]
[Canonicalized Headers]
[Canonicalized Resource]
```

Each component has specific rules (trimming, empty-string handling, ordering, etc.) per Azure spec.

### Example Canonical String

For a file upload:
```
PUT

image/jpeg
Mon, 18 May 2026 12:34:56 GMT


/account/container/blob.jpg
x-ms-date:Mon, 18 May 2026 12:34:56 GMT
x-ms-meta-userId:user-123
```

Notice:
- Content-Length on line 4 (included in signature)
- Content-Type on line 6 (included in signature)
- x-ms-meta-* headers at end (included in signature)
- Blob path at end (included in signature)

### Key Principle: Everything in the Signature

**The signature includes every meaningful piece of information about the request.** This is why replay attacks are cryptographically impossible:

- Different file → different blob path → different canonical string → different signature
- Different file size → different content-length → different canonical string → different signature
- Different file type → different content-type → different canonical string → different signature

## Signature Generation

### Step 1: Build Canonical String

```typescript
function buildSignableString(
  method: string,
  contentType: string,
  contentLength: number,
  containerName: string,
  blobName: string,
  metadata?: Record<string, string>
): string {
  const canonicalHeaders = buildCanonicalHeaders(metadata);
  const canonicalResource = `/${accountName}/${containerName}/${blobName}`;
  
  return `${method}


${contentLength}

${contentType}

${canonicalHeaders}
${canonicalResource}`;
}
```

### Step 2: HMAC-SHA256 Signature

```typescript
function signCanonicalString(
  canonicalString: string,
  accountKey: string // Base64-encoded, from connection string
): string {
  // 1. Base64-decode the account key
  const decodedKey = Buffer.from(accountKey, 'base64');
  
  // 2. Compute HMAC-SHA256
  const hmac = crypto
    .createHmac('sha256', decodedKey)
    .update(canonicalString, 'utf-8')
    .digest('base64');
  
  // 3. Return signature (base64-encoded)
  return hmac;
}
```

### Step 3: Format Authorization Header

```typescript
function createAuthorizationHeader(
  accountName: string,
  signature: string
): string {
  return `SharedKey ${accountName}:${signature}`;
}
```

**Example result**: `SharedKey myaccount:nCuYvbGa3N7D2kL5pQ8rS9vJ/Xt2mP6wY3aB1cE4=`

## Metadata-Locking Verification

### Server-Side: Azure Storage Validates

When client sends a PUT request:

```
PUT /container/blob.jpg HTTP/1.1
Host: account.blob.core.windows.net
Authorization: SharedKey account:nCuYvbGa3N7D2kL5pQ8rS9vJ/Xt2mP6wY3aB1cE4=
Content-Type: image/jpeg
Content-Length: 102400
x-ms-meta-userId: user-123
x-ms-date: Mon, 18 May 2026 12:34:56 GMT
```

Azure Storage:
1. **Extracts** the canonical string from the request
2. **Rebuilds** the canonical string using the exact values from headers
3. **Recomputes** HMAC-SHA256 with the stored account key
4. **Compares** computed signature vs. provided signature

If ANY of these changed:
- Blob path ← Different resource
- Content-Type ← Different canonical line 6
- Content-Length ← Different canonical line 4
- x-ms-meta-* headers ← Different canonical headers
- x-ms-date ← Different canonical headers

Then: **Computed signature ≠ Provided signature → 403 Forbidden (Authentication Failed)**

### Attack Scenario: Client Attempts Metadata Tampering

**What client tries:**
```
Server authorized:
- Blob: "user-123-avatar.jpg"
- Size: 102400 bytes
- Type: image/jpeg
- Signature: nCuYvbGa3N7D2kL5pQ8rS9vJ/Xt2mP6wY3aB1cE4=

Client sends:
- Blob: "user-456-avatar.jpg"        ← DIFFERENT
- Size: 102400 bytes
- Type: image/jpeg
- Signature: nCuYvbGa3N7D2kL5pQ8rS9vJ/Xt2mP6wY3aB1cE4= ← Same as before
```

**Azure Storage validation:**
1. Canonical string includes path: `/account/container/user-456-avatar.jpg`
2. Recompute HMAC-SHA256 of this new canonical string
3. Get different signature (path changed)
4. Compare: received signature ≠ recomputed signature
5. **Reject with 403 Forbidden**

Client **cannot** forge the signature because they don't have the account key.

## Cryptographic Guarantees

### HMAC-SHA256 Properties

**HMAC-SHA256 is a message authentication code.** It guarantees:

1. **Authenticity**: Only someone with the key can generate a valid HMAC
2. **Integrity**: Changing any bit of the message produces completely different HMAC
3. **Non-repudiation**: Server can prove client had the key
4. **Deterministic**: Same input always produces same output

### Content Binding Guarantees

Because the content (and content-type) are part of the canonical string:

| Change | Effect on Signature |
|---|---|
| Change blob name | ✗ Invalid signature |
| Change file size | ✗ Invalid signature |
| Change MIME type | ✗ Invalid signature |
| Change any metadata header | ✗ Invalid signature |
| Change HTTP method (PUT→GET) | ✗ Invalid signature |
| Delay upload (same day) | ✓ Valid (date not part of blob identity) |
| Delay upload (different day) | ✗ Invalid (x-ms-date expires) |

## Comparison to Alternatives

### vs. SAS Tokens

| Aspect | SAS Token | Canonical Auth Header |
|---|---|---|
| **Time enforcement** | ✓ Expiration checked | ✓ Can add expiration |
| **Permissions scoping** | ✓ Granular (Read/Write/List) | ✓ HTTP method scoping |
| **Content binding** | ✗ Not verified by default | ✓ Built-in to signature |
| **Replay across blobs** | Possible (server must check) | Impossible (signature invalid) |
| **Server-side validation** | Required | Not needed |
| **Standards compliance** | Azure extension | REST API standard |
| **Complexity** | Medium | Medium |
| **Security guarantee** | Policy-based | Cryptographic |

### vs. OAuth 2.0 / Azure AD

| Aspect | OAuth 2.0 | Canonical Auth Header |
|---|---|---|
| **Credential exposure** | ✓ No credentials shared | ✓ No credentials shared |
| **Direct upload** | ✗ Requires proxy | ✓ Client uploads directly |
| **Content binding** | ✓ Server-side validation | ✓ Cryptographic |
| **Setup complexity** | High (auth server) | Low |
| **Performance** | High latency (OAuth flow) | Instant (pre-signed) |

**When to use OAuth**: User authentication, access control, audit trails
**When to use Canonical Headers**: Direct client uploads, pre-signed requests, lightweight auth

## Security Best Practices

### 1. Use Narrow Permissions

```typescript
// ✓ GOOD: Client gets auth only for specific blob
const auth = await blobService.createBlobWriteAuthorizationHeader({
  containerName: 'uploads',
  blobName: `user-${userId}/avatar.jpg`, // Specific to this user
  contentLength: fileSize,
  contentType,
});

// ✗ BAD: Don't give client a generic SAS token for entire container
// (they could upload arbitrary files)
```

### 2. Validate on Server Before Signing

```typescript
// ✓ GOOD: Server validates before generating auth
async function requestUploadAuth(req: Request) {
  const userId = req.user.id; // Authenticated
  const { fileSize, contentType } = req.body;
  
  // Validate
  if (fileSize > 5 * 1024 * 1024) throw new Error('Max 5MB');
  if (!allowedTypes.includes(contentType)) throw new Error('Invalid type');
  
  // Only then sign
  const auth = await blobService.createBlobWriteAuthorizationHeader({
    containerName: 'uploads',
    blobName: `${userId}.jpg`,
    contentLength: fileSize,
    contentType,
  });
  
  return auth;
}
```

### 3. Use Short-Lived Tokens

```typescript
// Consider adding expiration to the header
// (separate from blob storage, via application logic)
const auth = await blobService.createBlobWriteAuthorizationHeader(...);
const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

// Client must upload within 15 minutes
return { auth, expiresAt };
```

### 4. Verify in Logs

```typescript
// After client uploads, verify in Azure Storage logs
// that the operation succeeded (201 Created)
// If you see 403 errors, it indicates tampering attempt

// Check Azure Monitor -> Log Analytics
// Query: StorageAccount_Events where OperationName == "PutBlob"
```

## Limitations & Caveats

### 1. No Expiration Built-In

The signature itself doesn't expire. You must:
- Track server-side: "This header is valid until X time"
- Or: Client submits header; server checks if still within valid window

### 2. Date Header Replay

If client captures an auth header today and tries to use it tomorrow, it might fail if your validation checks x-ms-date staleness.

**Mitigation**: Use short TTL for auth headers (15 minutes recommended).

### 3. Account Key Compromise

If the storage account key is leaked, attacker can forge any signature.

**Mitigation**: 
- Rotate keys regularly (Azure can do this automatically)
- Use managed identity for backend ops (no keys in code)
- Keep connection string in secure storage (Key Vault)

## Testing Metadata-Locking

Cellix includes comprehensive tests verifying metadata-locking:

```typescript
// Run tests
pnpm --filter @cellix/service-blob-storage run test

// Look for tests like:
// ✓ auth header for one blob cannot be reused for a different blob
// ✓ auth header locks in content-length metadata
// ✓ auth header locks in content-type metadata
// ✓ auth header locks in blob metadata
// ✓ auth header locks in HTTP method
```

All tests pass against both Azurite (local) and Azure Storage (production).

## Related Documentation

- [Client Uploads Implementation](./client-uploads-with-auth-headers)
- [Authentication Strategies](./authentication-strategies)
- [Official Azure Documentation](https://learn.microsoft.com/en-us/rest/api/storageservices/authorize-with-shared-key)
