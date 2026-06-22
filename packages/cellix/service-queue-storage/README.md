# @cellix/service-queue-storage

Type-safe Azure Queue Storage helpers for CellixJS. This package provides a small framework for defining typed queue contracts (JSON Schema), wiring producers and consumers via a typed registry, and returning registered queue services that expose only lifecycle methods plus the typed queue operations for that application.

## Installation

pnpm add @cellix/service-queue-storage

## Quick start

```typescript
import { createRegisteredQueueService, defineQueue, registerQueues } from '@cellix/service-queue-storage'
import { schema as orderCreatedSchema, type Schema as OrderCreatedMessage } from './schemas/outbound/order-created.schema.generated'

// 1. Define your queues (typically in @ocom/service-queue-storage)
// The generated wrapper comes from a sibling order-created.schema.json file.

const orderCreatedQueue = defineQueue<OrderCreatedMessage>()(({ $payload }) => ({
  queueName: 'order-created',
  schema: orderCreatedSchema,
  loggingTags: { source: 'orders', orderId: $payload.orderId }
}))

// 2. Register queues — returns typed stubs and a bound Service base class
const queueRegistry = registerQueues({
  outbound: { orderCreated: orderCreatedQueue },
  inbound: {},
})

// 3. Extend the Service base class in your application-specific package
class MyServiceQueueStorage extends queueRegistry.Service {
  constructor(options: { accountName?: string; connectionString?: string }) {
    super({
      accountName: options.accountName,
      connectionString: options.connectionString,
    })
  }
}

// Or expose the registered service directly
const MyServiceQueueStorage = createRegisteredQueueService(queueRegistry)

// 4. Create an instance and use it — queue methods are available immediately
const svc = new MyServiceQueueStorage({ accountName: 'my-storage-account' })
await svc.startUp()
await svc.sendMessageToOrderCreatedQueue({ orderId: '123' })
```

Use a domain noun for the queue key. The key drives generated method names, so keys should not end in `Queue` unless you want names like `sendMessageToOrderCreatedQueueQueue`.

Managed identity is the preferred production authentication mode. `connectionString` remains supported for Azurite and for consumers that explicitly need shared-key access.

## Schema type generation

If you keep queue payload schemas in standalone `.schema.json` files, use the bundled CLI to generate typed wrapper modules:

```json
{
  "scripts": {
    "gen": "cellix-generate-queue-schema-types src/schemas",
    "prebuild": "pnpm run gen && pnpm run lint"
  }
}
```

For `src/schemas/outbound/order-created.schema.json`, the CLI writes `src/schemas/outbound/order-created.schema.generated.ts`:

```typescript
import { schema as orderCreatedSchema, type Schema as OrderCreatedMessage } from './order-created.schema.generated'
```

The generator is intentionally minimal. It only converts external JSON into a typed `as const satisfies JSONSchema` wrapper so `json-schema-to-ts` can continue to own schema-to-type inference.

## API reference

- `registerQueues`: factory that accepts `outbound`/`inbound` queue maps and returns:
  - `producer` — typed stub object (used for TypeScript type inference in consumer packages)
  - `consumer` — typed stub object (used for TypeScript type inference in consumer packages)
  - `Service` — a class with lifecycle methods, opt-in logging controls, and all typed queue methods wired in the constructor. Extend this class to create an application-specific queue service.
- `deriveProvisionQueues`: helper that derives unique physical queue names from registered definitions when you intentionally want to override the default provisioning subset
- `createRegisteredQueueService`: helper that turns a registered queue registry into an instantiable service constructor; the registry type is inferred from the argument
- `defineQueue`: preferred helper for authoring typed queue definitions with `$payload.<field>` support and no local setup boilerplate
- `RegisteredQueueService`: public type for an application-specific queue service returned from `registerQueues()`
- `QueueServiceLifecycle`: lifecycle contract implemented by registered queue services
- `QueueServiceLogging`: enables or disables queue logging after construction
- `QueueDefinition`: type describing `queueName` and message JSON Schema.
- `QueueStorageConfig`: configuration type for constructing registered queue services.
- `QueueMessage<T>`: type for received queue messages (id, payload, dequeueCount, optional popReceipt).
- `QueueMessageLogBlobStorage`: minimal blob-storage shape accepted by `enableLogging(...)`.

## Blob logging

Logging can be enabled either in the constructor config or later through the registered service instance:

```typescript
const svc = new MyServiceQueueStorage({ accountName: 'my-storage-account' })
await svc.startUp()
svc.enableLogging(blobStorage, { enabled: true, container: 'queue-logs' })
```

When blob-backed logging is enabled, the package writes one blob per message:

- Blob names are prefixed by queue direction: `inbound/` or `outbound/`
- Blob filenames use the message timestamp in ISO UTC form, for example `2026-05-27T15:14:30.000Z.json`
- Blob content is the message payload JSON itself, not a wrapper envelope
- Blob tags always include `queueName`
- Queue definitions can add custom tags and metadata, including values resolved from the message payload at runtime
- The preferred syntax is `defineQueue<MyPayload>()(({ $payload }) => ({ ... }))`, then use `$payload.<field>` inside the definition callback
- The equivalent explicit form `{ payloadField: 'communityId' }` is also supported for advanced/manual cases
- `defineQueue<MyPayload>()` ensures `$payload.<field>` is checked against the keys of `MyPayload` without separate payload helper setup
- Advanced consumers may still provide a custom `IQueueMessageLogger` implementation instead of blob storage when they need a different persistence mechanism

## Auto-provisioning

When a registered queue service is started with a connection string pointing at Azurite or when `NODE_ENV=development`, it will attempt to create all registered queue names by default. Override `serviceDefaults.provisionQueues` only when you intentionally want to provision a subset. This is intended for local development only.
