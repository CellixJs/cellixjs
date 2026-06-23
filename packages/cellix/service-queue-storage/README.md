# @cellix/service-queue-storage

Use this package when an application needs Azure Storage Queue send, receive, or peek operations through a typed service instead of raw queue client calls.

## Install

```bash
pnpm add @cellix/service-queue-storage
```

## What You Do With It

In an application package such as `@ocom/service-queue-storage`, you:

1. define queue payload schemas in `.schema.json` files
2. generate typed schema wrappers
3. define queues with `defineQueue<TPayload>()`
4. register outbound and inbound queues
5. export a concrete `ServiceQueueStorage` constructor and a `QueueStorageOperations` type
6. use the generated queue methods in application services

## Add A Queue

### 1. Create the payload schema

Create a JSON Schema file beside the queue definition:

```json
{
	"$schema": "http://json-schema.org/draft-07/schema#",
	"title": "OrderCreatedPayload",
	"type": "object",
	"properties": {
		"orderId": { "type": "string" },
		"createdBy": { "type": "string" }
	},
	"required": ["orderId", "createdBy"],
	"additionalProperties": false
}
```

### 2. Generate the typed wrapper

Add this to the consumer package:

```json
{
	"scripts": {
		"gen": "cellix-generate-queue-schema-types src/schemas",
		"prebuild": "pnpm run gen && pnpm run lint"
	}
}
```

This generates a sibling `.schema.generated.ts` file that exports:

```ts
export const schema = /* schema value */;
export type Schema = /* inferred payload type */;
```

### 3. Define the queue

```ts
import { defineQueue } from '@cellix/service-queue-storage';
import { schema as orderCreatedSchema, type Schema as OrderCreatedPayload } from './order-created.schema.generated';

export type { OrderCreatedPayload };

export const orderCreatedQueue = defineQueue<OrderCreatedPayload>()(({ $payload }) => ({
	queueName: 'order-created',
	schema: orderCreatedSchema,
	loggingTags: {
		orderId: $payload.orderId,
	},
	loggingMetadata: {
		createdBy: $payload.createdBy,
	},
}));
```

### 4. Register the queue

```ts
import { registerQueues } from '@cellix/service-queue-storage';
import { orderCreatedQueue } from './schemas/outbound/order-created';
import { importRequestsQueue } from './schemas/inbound/import-requests';

const queues = registerQueues({
	outbound: {
		orderCreated: orderCreatedQueue,
	},
	inbound: {
		importRequests: importRequestsQueue,
	},
});
```

### 5. Export the service and operations type

```ts
import {
	createRegisteredQueueService,
	type QueueRegistryOperations,
	type QueueRegistryService,
} from '@cellix/service-queue-storage';

export const ServiceQueueStorage = createRegisteredQueueService(queues);

export type ServiceQueueStorage = QueueRegistryService<typeof queues>;
export type QueueStorageOperations = QueueRegistryOperations<typeof queues>;
```

Use:

- `ServiceQueueStorage` at application bootstrap
- `QueueStorageOperations` in application-service dependencies

## Use The Service

### Create the service

Use one of:

- `new ServiceQueueStorage({ accountName })`
- `new ServiceQueueStorage({ connectionString })`

Example:

```ts
const service = new ServiceQueueStorage({ accountName: 'my-storage-account' });
await service.startUp();
```

### Send to an outbound queue

```ts
await service.sendMessageToOrderCreatedQueue({
	orderId: 'order-123',
	createdBy: 'system',
});
```

### Receive from an inbound queue

```ts
const message = await service.receiveFromImportRequestsQueue();

if (message) {
	console.log(message.payload);
}
```

### Peek at a queue

```ts
const messages = await service.peekAtImportRequestsQueue();
```

## Queue Naming

Each queue has:

- a registry key, for example `orderCreated`
- a physical queue name, for example `order-created`
- generated methods, for example `sendMessageToOrderCreatedQueue(...)`

The method name comes from the registry key. Keep keys concise and do not end them with `Queue`.

## Logging

If you want queue messages logged to blob storage:

```ts
service.enableLogging(blobStorage, {
	enabled: true,
	container: 'queue-logs',
});
```

You can set:

- `enabled`
- `container`
- `await`

Queue definitions can also provide:

- `loggingTags`
- `loggingMetadata`

Use `$payload.<field>` inside `defineQueue<TPayload>()` when those values should come from the payload.

## Local Development

When using Azurite or `NODE_ENV=development`, registered queues are created automatically by default.

If you want to provision only a subset, pass `serviceDefaults.provisionQueues` to `registerQueues(...)`.

## Exports You Will Usually Use

- `defineQueue`
- `registerQueues`
- `createRegisteredQueueService`
- `QueueRegistryOperations`
- `QueueRegistryService`
- `QueueStorageConfig`
- `QueueLoggingConfig`
- `$payload`
- `payloadFields`
- `JSONSchema`
- `FromSchema`

Most consumers do not need anything else.
