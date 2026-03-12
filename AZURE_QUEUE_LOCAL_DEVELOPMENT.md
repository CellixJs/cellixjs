# Azure Queue Storage - Local Development Guide

## Overview

This guide explains how to set up and use Azure Queue Storage locally with Azurite for development and testing.

## Prerequisites

- Node.js v22+ (as required by the project)
- pnpm package manager
- Azurite (Azure Storage Emulator)

## Installing Azurite

Install Azurite globally:

```bash
npm install -g azurite
```

Or use it via npx (no installation required):

```bash
npx azurite
```

## Starting Azurite

Start Azurite with the recommended settings:

```bash
# Basic start (foreground)
azurite --silent --location ./azurite

# With debug logging
azurite --silent --location ./azurite --debug ./azurite/debug.log

# Background mode (Linux/Mac)
azurite --silent --location ./azurite &
```

Azurite will start the following services:
- **Blob Service**: http://127.0.0.1:10000
- **Queue Service**: http://127.0.0.1:10001
- **Table Service**: http://127.0.0.1:10002

## Configuration

Set the Azure Storage connection string environment variable:

```bash
export AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;QueueEndpoint=http://127.0.0.1:10001/devstoreaccount1;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;"
```

Or add it to your `.env` file (if using dotenv):

```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;QueueEndpoint=http://127.0.0.1:10001/devstoreaccount1
```

## Running the Application

1. **Start Azurite** (in a separate terminal):
   ```bash
   azurite --silent --location ./azurite
   ```

2. **Start the application**:
   ```bash
   pnpm run dev
   ```

The application will:
- Connect to Azurite for queue and blob storage
- Create queues automatically on startup (`community-created`, `member`)
- Create the `queue-messages` blob container for message logging

## Testing Queue Operations

### Outbound Queue (community-created)

Create a new community to trigger an outbound queue message:

```bash
# Use the GraphQL or REST API to create a community
# This will automatically send a message to the community-created queue
```

The message will be:
- Sent to the `community-created` queue
- Logged to `queue-messages/outbound/{timestamp}.json` in blob storage

### Inbound Queue (member)

Send a message to the member queue for processing:

```bash
# You can use Azure Storage Explorer or a custom script to add messages
# Or use the Azure Storage SDK directly
```

Example message payload:
```json
{
  "memberId": "65abc123def456789",
  "updates": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  }
}
```

The message will be:
- Received by the queue trigger function
- Processed to update the member in MongoDB
- Logged to `queue-messages/inbound/{timestamp}.json` in blob storage
- Deleted from the queue after successful processing

## Viewing Queue Messages

### Using Azure Storage Explorer

1. Download and install [Azure Storage Explorer](https://azure.microsoft.com/en-us/products/storage/storage-explorer/)
2. Connect to local emulator:
   - Click "Connect" → "Local Emulator"
   - Use the default connection string
3. Navigate to:
   - **Queues** → View `community-created` and `member` queues
   - **Blob Containers** → `queue-messages` → View logged messages

### Using Azure CLI (with Azurite)

```bash
# Install Azure CLI
# Then connect to local emulator

# List queues
az storage queue list --connection-string "$AZURE_STORAGE_CONNECTION_STRING"

# Peek messages
az storage message peek --queue-name community-created --connection-string "$AZURE_STORAGE_CONNECTION_STRING"

# List blobs (message logs)
az storage blob list --container-name queue-messages --connection-string "$AZURE_STORAGE_CONNECTION_STRING"
```

### Using Code

See the examples in `@cellix/queue-storage-seedwork/README.md` and `@ocom/service-queue-storage/README.md`.

## Troubleshooting

### Azurite won't start

- **Error**: Port already in use
  - **Solution**: Stop any existing Azurite instances or change the port:
    ```bash
    azurite --silent --location ./azurite --blobPort 10100 --queuePort 10101
    ```

### Connection errors

- **Error**: "connect ECONNREFUSED"
  - **Solution**: Ensure Azurite is running before starting the application

### Queues not created

- **Error**: Queue not found
  - **Solution**: The application creates queues automatically on startup. Check logs for errors.

### Message logging failures

- **Error**: Blob container not found
  - **Solution**: The `queue-messages` container is created automatically. Check Azurite logs.

## Differences from Production

### Azurite vs Azure Storage

- **Authentication**: Azurite uses a fixed account key; Azure uses managed identities or SAS tokens
- **Performance**: Azurite is slower and single-threaded
- **Persistence**: Azurite stores data in the `./azurite` directory; delete this to reset
- **Features**: Some advanced Azure Storage features may not be available in Azurite

### Connection Strings

- **Local (Azurite)**:
  ```
  DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;...
  ```

- **Production (Azure)**:
  ```
  DefaultEndpointsProtocol=https;AccountName=myaccount;AccountKey=...;EndpointSuffix=core.windows.net
  ```

## Cleanup

To reset local storage:

```bash
# Stop Azurite
# Delete the storage directory
rm -rf ./azurite

# Restart Azurite
azurite --silent --location ./azurite
```

## Next Steps

- See `@cellix/queue-storage-seedwork/README.md` for seedwork API documentation
- See `@ocom/service-queue-storage/README.md` for application service usage
- See main project README for deployment to Azure

## References

- [Azurite Documentation](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azurite)
- [Azure Storage Queue Documentation](https://learn.microsoft.com/en-us/azure/storage/queues/)
- [Azure Storage Explorer](https://azure.microsoft.com/en-us/products/storage/storage-explorer/)
