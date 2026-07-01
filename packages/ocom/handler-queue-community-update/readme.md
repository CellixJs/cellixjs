# @ocom/handler-queue-community-update

Azure Functions Storage Queue trigger handler for community update messages in the Cellix framework.

## Purpose

This package provides the Azure Functions Storage Queue trigger handler that processes `community-update` queue messages. It integrates with `@ocom/service-queue-storage` for message validation and deserialization, and with `@ocom/application-services` to apply community settings updates.

## Exports

- `communityUpdateQueueHandlerCreator` — factory function that returns an Azure Functions `StorageQueueHandler` for the `community-update` queue.

## Usage

### Creating and registering the handler

```typescript
import { communityUpdateQueueHandlerCreator } from '@ocom/handler-queue-community-update';
import { ServiceQueueStorage } from '@ocom/service-queue-storage';

Cellix
  .initializeInfrastructureServices(...)
  .setContext(...)
  .initializeApplicationServices(...)
  .registerAzureFunctionQueueHandler(
    'community-update',
    { queueName: 'community-update', connection: 'AzureWebJobsStorage' },
    (host, infra) =>
      communityUpdateQueueHandlerCreator(
        host,
        infra.getInfrastructureService(ServiceQueueStorage),
      ),
  )
  .startUp();
```

### Handler behaviour

On each queue trigger:

1. Extracts trigger metadata (`id`, `popReceipt`, `dequeueCount`) from the Azure Functions context.
2. Validates and deserializes the raw queue entry via `@ocom/service-queue-storage` `receiveFromCommunityUpdateQueue`.
3. Creates a request-scoped application services instance via the `ApplicationServicesFactory`.
4. Calls `Community.updateSettings` with the payload fields (`name`, `domain`, `whiteLabelDomain`, `handle`), including only the fields present in the message.
5. Logs and swallows `community not found` errors; rethrows all other errors so the Functions runtime retries the message.

## Related packages

- `@ocom/service-queue-storage` — queue registry, schema validation, and typed message deserialization.
- `@ocom/application-services` — application services factory providing request-scoped services.
- `apps/api` — composition root that wires this handler into the Azure Functions host via Cellix.
