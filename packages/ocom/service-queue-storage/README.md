# @ocom/service-queue-storage

Azure Queue Storage infrastructure service for the Owner Community application.

## Features

- **Type-safe queue operations** for community-created events and member updates
- **Automatic blob logging** for all sent/received messages
- **Schema validation** using JSON Schema
- **OpenTelemetry tracing** integration
- **Lifecycle management** via ServiceBase interface

## Queues

### Outbound: `community-created`

Sends integration events when a new community is created.

**Payload:**
```typescript
{
  communityId: string;
  name: string;
  createdAt: string; // ISO 8601
}
```

**Usage:**
```typescript
const queueService = infraRegistry.getService(ServiceQueueStorage);
await queueService.communitySender.sendMessage({
  communityId: '123',
  name: 'My Community',
  createdAt: new Date().toISOString(),
});
```

### Inbound: `member`

Receives member update messages from external systems.

**Payload:**
```typescript
{
  memberId: string;
  updates: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }
}
```

**Usage:**
```typescript
const queueService = infraRegistry.getService(ServiceQueueStorage);
const messages = await queueService.memberReceiver.receiveMessages();

for (const { message, messageId, popReceipt } of messages) {
  // Process message
  await updateMember(message.payload);
  
  // Delete from queue
  await queueService.memberReceiver.deleteMessage(messageId, popReceipt);
}
```

## Registration

Register the service during Cellix infrastructure setup:

```typescript
Cellix.initializeInfrastructureServices((registry) => {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
  registry.registerInfrastructureService(
    new ServiceQueueStorage(connectionString)
  );
})
```

## Blob Logging

All messages are automatically logged to Azure Blob Storage:

- **Outbound**: `queue-messages/outbound/{timestamp}.json`
- **Inbound**: `queue-messages/inbound/{timestamp}.json`

Each blob includes metadata and tags for filtering and categorization.

## Local Development

Use Azurite for local development:

```bash
# Start Azurite
azurite --silent --location ./azurite

# Set connection string
export AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;QueueEndpoint=http://127.0.0.1:10001/devstoreaccount1;"
```

## Dependencies

- `@cellix/queue-storage-seedwork` - Base queue operations
- `@cellix/api-services-spec` - Service interface
- `@opentelemetry/api` - Tracing
