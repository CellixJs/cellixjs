# Package Manifest: @cellix/service-queue-storage

## Purpose

Type-safe Azure Queue Storage service for CellixJS — provides consistent message delivery with JSON Schema validation (Ajv), blob storage logging, and auto-provisioning in development environments.

## Scope

This package provides:
- Outbound queue send operations with per-queue JSON Schema validation and encoding
- Inbound queue receive and peek operations for consumers (dequeue and visibility)
- Auto-provisioning of queues when running against Azurite or when NODE_ENV=development
- Optional message logging to blob storage via a pluggable logger interface

## Non-goals

- Azure Functions trigger adapters (this package does not implement Function triggers)
- Message routing, topic fanout, or cross-service message bus functionality
- Full dead-letter queue lifecycle management

## Public API shape

Public exports:
- `defineQueue<TPayload>()` — preferred queue-definition helper that injects a typed `$payload` proxy into a callback
- `registerQueues({ outbound, inbound })` — factory that returns a typed registry with `producer` stubs, `consumer` stubs, and a `Service` base class
- `RegisteredQueueService<O, I>` — public type for lifecycle plus typed queue methods produced by `registerQueues`
- `QueueServiceLifecycle` — lifecycle contract implemented by registered queue services
- `QueueDefinition<S>` — type describing queue name and message JSON Schema
- `QueueStorageConfig` — configuration type for constructing registered queue services
- `QueueMessage<T>` — type for received queue messages
- `BlobQueueMessageLogger` — optional helper that writes queue payloads to blob storage under `inbound/` or `outbound/` prefixes and automatically tags each blob with `queueName`

## Core concepts

- `QueueDefinition`: describes a queue's logical name, the JSON Schema for messages, and optional logging tags and metadata.
- `defineQueue`: preferred authoring helper for queue definitions because it provides a typed `$payload` proxy without per-file setup noise.
- `registerQueues`: accepts maps of outbound and inbound `QueueDefinition` objects and returns a typed registry. The registry exposes a `Service` class with lifecycle methods and typed queue methods already wired in the constructor — no separate bind step is required.
- `Service` class pattern: consumer packages extend `registry.Service` to create an application-specific queue storage service. The queue bindings (producer methods, consumer methods) are applied automatically during construction via `Object.assign`. AJV validators are compiled once at `registerQueues()` call time and reused across instances.

## Package boundaries

This package is framework-level infrastructure. It must not contain application-specific queue names or schemas — those belong in consumer packages such as `@ocom/service-queue-storage`.

## Dependencies / relationships

- Depends on `@cellix/service-blob-storage` (or a blob-like adapter) for message envelope persistence when logging is enabled.
- Consumed by `@ocom/service-queue-storage` which provides concrete queue definitions and wiring.

## Testing strategy

- Public behaviors are verified via vitest-cucumber feature files that run through the consumer-facing `registerQueues` factory and registered queue service class.
- Tests must import only from the package entrypoint (the barrel) to encourage stable public contracts.

## Documentation obligations

- Public exports must include TSDoc with `@param`, `@returns`, and `@example` where relevant.
- `manifest.md` and `README.md` must remain aligned with actual exported surface and usage examples.

## Release-readiness standards

- Internal-only exports must not be published; the barrel should be reviewed for inadvertent leakage.
- This package is currently maintained for internal monorepo consumption and is considered pre-release. Any change to the export surface should be evaluated for semver impact and consumer compatibility.
