---
sidebar_position: 5
title: "Troubleshooting"
description: "Common issues, configuration errors, and solutions"
---

# Troubleshooting Blob Storage

## Configuration Errors

### Error: "Either connectionString or accountName must be provided"

**Cause**: `ServiceBlobStorage` constructor called without both options.

**Solution**:
```typescript
// ✗ WRONG
const blobService = new ServiceBlobStorage({});

// ✓ RIGHT: Backend only
const blobService = new ServiceBlobStorage({
  accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
});

// ✓ RIGHT: Backend + client uploads
const blobService = new ServiceBlobStorage({
  accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
});
```

### Error: "Missing AZURE_STORAGE_ACCOUNT_NAME"

**Cause**: Environment variable not set or empty.

**Solution**:

**Local development:**
```bash
export AZURE_STORAGE_ACCOUNT_NAME=devstoreaccount1
```

**Production**: Set in Azure portal under Function App → Configuration → Application settings

**Verify**:
```typescript
console.log(process.env.AZURE_STORAGE_ACCOUNT_NAME); // Should print account name
```

### Error: "Invalid connection string" or "Cannot parse connection string"

**Cause**: Connection string malformed or has extra whitespace.

**Solutions**:

1. **Check for whitespace**:
```bash
# ✗ WRONG: Has spaces around =
export AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol = https://..."

# ✓ RIGHT: No spaces
export AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https://..."
```

2. **Verify all required keys**:
```bash
# ✓ GOOD: Has DefaultEndpointsProtocol, AccountName, AccountKey
export AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https://myaccount.blob.core.windows.net/;AccountName=myaccount;AccountKey=...;EndpointSuffix=core.windows.net"

# ✗ BAD: Missing AccountKey
export AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https://..."
```

3. **For Azurite (local)**:
```bash
export AZURE_STORAGE_CONNECTION_STRING="UseDevelopmentStorage=true"
# OR explicit
export AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=http://127.0.0.1:10000/devstoreaccount1;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OtQ3Q7AeFFS=;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1/"
```

## Upload Failures

### Error: "403 Forbidden" on Client Upload

**Most common cause**: Metadata mismatch (client sent different content-length, content-type, or metadata).

**Debug checklist**:

1. **Verify file size matches**:
```typescript
// Server authorized
const auth = await blobService.createBlobWriteAuthorizationHeader({
  contentLength: 102400, // 100 KB
});

// Client must send exactly 102400 bytes
// ✗ WRONG: Sending 100 bytes
fetch(url, { body: smallBlob });

// ✓ RIGHT: Send exact size
fetch(url, { body: exactSizeBlob });
```

2. **Verify content-type matches**:
```typescript
// Server authorized
const auth = await blobService.createBlobWriteAuthorizationHeader({
  contentType: 'image/jpeg',
});

// Client must send matching header
// ✗ WRONG: Sending different type
headers['Content-Type'] = 'image/png';

// ✓ RIGHT: Send exact type
headers['Content-Type'] = 'image/jpeg';
```

3. **Verify metadata headers match**:
```typescript
// Server authorized with metadata
const auth = await blobService.createBlobWriteAuthorizationHeader({
  metadata: {
    userId: '123',
  },
});

// Client must send matching metadata
// ✗ WRONG: Different metadata
headers['x-ms-meta-userId'] = '456';

// ✓ RIGHT: Send exact metadata
headers['x-ms-meta-userId'] = '123';
```

4. **Check x-ms-date header**:
```typescript
// x-ms-date must be set and within ~15 minutes of server time
// ✗ WRONG: Client clock way off
headers['x-ms-date'] = new Date('2020-01-01').toUTCString();

// ✓ RIGHT: Use current time
headers['x-ms-date'] = new Date().toUTCString();
```

5. **Log both sides**:
```typescript
// Server-side: Log what was authorized
console.log('Authorized:', {
  contentLength: 102400,
  contentType: 'image/jpeg',
  blobName: 'avatar.jpg',
});

// Client-side: Log what's being sent
console.log('Sending:', {
  'Content-Length': formData.size,
  'Content-Type': file.type,
  body: file,
});
```

### Error: "Empty blob created, but upload failed"

**Cause**: Request headers validated but body failed to upload (network issue, timeout, etc.).

**Result**: 0-byte blob exists in storage.

**Solution**: Clean up 0-byte blobs
```typescript
// Periodically list and delete 0-byte blobs
const blobs = await blobService.listBlobs('my-container');
for (const blob of blobs) {
  if (blob.size === 0) {
    await blobService.deleteBlob('my-container', blob.name);
  }
}
```

### Error: "401 Unauthorized" on Client Upload

**Cause**: Signature invalid or connection string is wrong.

**Verify**:

1. Connection string is correct:
```bash
# Check it parses correctly
node -e "console.log(process.env.AZURE_STORAGE_CONNECTION_STRING)"
```

2. Account key isn't corrupted:
```typescript
// If AccountKey in connection string has special characters, ensure proper escaping
// ✗ WRONG: AccountKey=abc+def/ghi== (unescaped +/)
// ✓ RIGHT: AccountKey=abc%2Bdef%2Fghi%3D%3D (URL encoded)
```

3. Try generating header locally:
```typescript
const auth = await blobService.createBlobWriteAuthorizationHeader({
  containerName: 'test',
  blobName: 'test.txt',
  contentLength: 10,
  contentType: 'text/plain',
});
console.log(auth.authorizationHeader); // Should print "SharedKey account:signature"
```

## Managed Identity Issues

### Error: "DefaultAzureCredential could not authenticate"

**Cause**: Application doesn't have managed identity assigned or RBAC role not granted.

**Solution**:

1. **Assign Managed Identity**:
   - Azure Portal → Function App → Settings → Identity
   - Click "On" (System assigned)
   - Click "Save"

2. **Grant RBAC Role**:
   - Go to Storage Account
   - Left menu → "Access Control (IAM)"
   - Click "+ Add" → "Add role assignment"
   - Role: "Storage Blob Data Contributor"
   - Assign to: Your Function App (by name)
   - Click "Review + assign"

3. **Verify**:
```bash
# In Azure CLI
az role assignment list --assignee <app-object-id> --scope <storage-account-resource-id>
```

### Error: "Managed identity cannot authenticate" (Azurite)

**Cause**: DefaultAzureCredential doesn't work with Azurite (no identity service).

**Solution**: Use connection string for local development
```typescript
const blobService = new ServiceBlobStorage({
  accountName: 'devstoreaccount1',
  connectionString: 'UseDevelopmentStorage=true', // Azurite will be used
});
```

## Connection String Issues

### Error: "Unable to start Azurite" in tests

**Cause**: Azurite not installed, port 10000 in use, or network issue.

**Solution**:

1. **Check Azurite installed**:
```bash
pnpm exec azurite-blob --version
```

2. **Check port available**:
```bash
# Kill process on port 10000 if needed
lsof -i :10000
kill -9 <PID>
```

3. **Run Azurite manually**:
```bash
pnpm exec azurite-blob --silent --blobPort 10000
# Should print: Azurite Blob service is listening at http://127.0.0.1:10000
```

4. **Run tests**:
```bash
pnpm --filter @cellix/service-blob-storage run test
```

## Authentication Header Generation

### Error: "Signature generation failed"

**Cause**: Canonical string building failed or HMAC computation error.

**Solution**:

1. **Check all parameters are set**:
```typescript
const auth = await blobService.createBlobWriteAuthorizationHeader({
  containerName: 'uploads', // ✓ Required
  blobName: 'file.jpg', // ✓ Required
  contentLength: 1000, // ✓ Required
  contentType: 'image/jpeg', // ✓ Required
  // metadata?: optional
});
```

2. **Verify blob service is initialized**:
```typescript
const blobService = new ServiceBlobStorage({...});
await blobService.startUp(); // ✓ Must call before using

// ✗ WRONG: Not calling startUp
await blobService.createBlobWriteAuthorizationHeader(...); // Will fail
```

## Performance Issues

### Slow Header Generation

**Cause**: Underlying HMAC computation or network latency.

**Solution**: Cache headers if same blob/metadata
```typescript
// ✗ Inefficient: Generate every time
for (const user of users) {
  const auth = await blobService.createBlobWriteAuthorizationHeader({
    blobName: `${user.id}.jpg`,
    contentLength: 1000,
    contentType: 'image/jpeg',
  });
}

// ✓ Better: Generate on-demand only
cache.set(`auth-${user.id}`, auth, 15 * 60 * 1000); // 15 min TTL
```

### High Memory Usage

**Cause**: Uploading large files without streaming.

**Solution**: Stream uploads from client
```typescript
// ✗ WRONG: Loading entire file into memory
const fileData = await file.arrayBuffer();
fetch(url, { body: fileData });

// ✓ RIGHT: Stream from file
fetch(url, { body: file });
```

## Getting Help

### Enabledebugging:

```typescript
// Enable detailed logging
process.env.DEBUG = '*azure*,*cellix*';

// Run with debug output
DEBUG=* pnpm --filter @cellix/service-blob-storage run test
```

### Check Azure Monitor Logs

```kusto
// Azure Portal → Storage Account → Logs
// Query successful uploads
StorageBlobLogs
| where OperationName == "PutBlob" and StatusCode == 201
| top 100 by TimeGenerated

// Query failed auth attempts
StorageBlobLogs
| where OperationName == "PutBlob" and StatusCode == 403
| top 100 by TimeGenerated
```

## Related Documentation

- [Client Uploads](./client-uploads-with-auth-headers)
- [Authentication Strategies](./authentication-strategies)
- [Canonical Auth Headers](./canonical-auth-headers)
