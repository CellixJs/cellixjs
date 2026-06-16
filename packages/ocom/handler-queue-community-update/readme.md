# @ocom/handler-queue-community-update

Azure Functions queue-trigger handler for the Owner Community `community-update` queue.

## Purpose

This package contains the queue-specific handler logic for processing `community-update` messages. It keeps application behavior out of `@apps/api`, which should remain responsible only for composing and registering handlers with Cellix.

## Usage

```typescript
import { communityUpdateQueueHandlerCreator } from '@ocom/handler-queue-community-update';
import { communityUpdateQueue } from '@ocom/service-queue-storage';

Cellix
  .initializeInfrastructureServices(...)
  .setContext(...)
  .initializeApplicationServices(...)
  .registerAzureFunctionQueueHandler(
    'community-update',
    { queueName: communityUpdateQueue.queueName, connection: 'AZURE_STORAGE_CONNECTION_STRING' },
    (applicationServicesFactory) => communityUpdateQueueHandlerCreator(applicationServicesFactory),
  )
  .startUp();
```

## Behavior

- validates incoming queue messages against the canonical queue schema
- resolves system-scoped application services
- updates an existing community when found
- logs and returns for missing communities
- throws predictable validation errors for invalid payloads
