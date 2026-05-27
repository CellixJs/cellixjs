# @cellix/service-queue-storage

Type-safe Azure Queue Storage helpers for CellixJS. This package provides a small framework for defining typed queue contracts (JSON Schema), wiring producers and consumers via a typed registry, and returning registered queue services that expose only lifecycle methods plus the typed queue operations for that application. It also includes an optional `BlobQueueMessageLogger` for persisting queue payloads to blob storage.

## Installation

pnpm add @cellix/service-queue-storage

## Quick start

```typescript
import { registerQueues, QueueDefinition } from '@cellix/service-queue-storage'

// 1. Define your queues (typically in @ocom/service-queue-storage)
const myQueueDef: QueueDefinition = {
  queueName: 'my-queue',
  schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  loggingTags: { source: 'my-service' }
}

// 2. Register queues — returns typed stubs and a bound Service base class
const queueRegistry = registerQueues({
  outbound: { myQueue: myQueueDef },
  inbound: {}
})

// 3. Extend the Service base class in your application-specific package
class MyServiceQueueStorage extends queueRegistry.Service {
  constructor(options: { connectionString: string }) {
    super({ connectionString: options.connectionString })
  }
}

// 4. Create an instance and use it — queue methods are available immediately
const svc = new MyServiceQueueStorage({ connectionString: 'UseDevelopmentStorage=true' })
await svc.startUp()
await svc.sendMessageToMyQueueQueue({ id: '123' })
```

## API reference

- `registerQueues`: factory that accepts `outbound`/`inbound` queue maps and returns:
  - `producer` — typed stub object (used for TypeScript type inference in consumer packages)
  - `consumer` — typed stub object (used for TypeScript type inference in consumer packages)
  - `Service` — a class with lifecycle methods and all typed queue methods wired in the constructor. Extend this class to create an application-specific queue service.
- `RegisteredQueueService`: public type for an application-specific queue service returned from `registerQueues()`
- `QueueServiceLifecycle`: lifecycle contract implemented by registered queue services
- `QueueDefinition`: type describing `queueName` and message JSON Schema.
- `QueueStorageConfig`: configuration type for constructing registered queue services.
- `QueueMessage<T>`: type for received queue messages (id, payload, dequeueCount, optional popReceipt).
- `BlobQueueMessageLogger`: optional helper to persist queue payloads to blob storage.

## Blob logging

When logging is enabled, the package writes one blob per message:

- Blob names are prefixed by queue direction: `inbound/` or `outbound/`
- Blob filenames use the message timestamp in ISO UTC form, for example `2026-05-27T15:14:30.000Z.json`
- Blob content is the message payload JSON itself, not a wrapper envelope
- Blob tags always include `queueName`
- Queue definitions can add custom tags and metadata, including values resolved from the message payload at runtime via `$payload.<field>`

## Auto-provisioning

When a registered queue service is started with a connection string pointing at Azurite or when `NODE_ENV=development`, it will attempt to create queues listed in the `provisionQueues` option. This is intended for local development only.
