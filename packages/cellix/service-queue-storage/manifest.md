# Package Manifest: @cellix/service-queue-storage

## Purpose

Type-safe Azure Queue Storage service for CellixJS — provides consistent message delivery with JSON Schema validation (Ajv), blob-backed logging on typed queue paths, and auto-provisioning in development environments.

## Scope

This package provides:
- Outbound queue send operations with per-queue JSON Schema validation and encoding
- Inbound queue receive and peek operations for consumers (dequeue and visibility)
- Auto-provisioning of queues when running against Azurite or when NODE_ENV=development
- Optional message logging via either a pluggable logger interface or a blob storage dependency that the framework adapts internally

## Non-goals

- Azure Functions trigger adapters (this package does not implement Function triggers)
- Message routing, topic fanout, or cross-service message bus functionality
- Full dead-letter queue lifecycle management

## Public API shape

Public exports:
- `defineQueue<TPayload>()` — preferred queue-definition helper that injects a typed `$payload` proxy into a callback
- `$payload` / `payloadFields<TPayload>()` / `resolveLoggingFields(...)` — payload-field authoring helpers for logging tags and metadata
- `registerQueues({ outbound, inbound })` — factory that returns a typed registry with `producer` stubs, `consumer` stubs, and a `Service` base class
- `deriveProvisionQueues(...)` — helper that derives unique physical queue names from a registry
- `createRegisteredQueueService(...)` — helper that narrows a registered `Service` constructor to a consumer-facing options type
- `RegisteredQueueRegistry<O, I>` — public type for the registry returned by `registerQueues`
- `RegisteredQueueService<O, I>` — public type for lifecycle plus typed queue methods produced by `registerQueues`
- `QueueRegistryProducer<TRegistry>` / `QueueRegistryConsumer<TRegistry>` / `QueueRegistryOperations<TRegistry>` / `QueueRegistryService<TRegistry>` — type helpers for extracting consumer-facing queue method surfaces from a registry
- `QueueProducerContext<O>` / `QueueConsumerContext<I>` — generated method surfaces for outbound and inbound queue maps
- `QueueServiceConstructorOptions` — common narrowed constructor contract for consumer packages
- `QueueServiceLifecycle` — lifecycle contract implemented by registered queue services
- `QueueServiceLogging` — opt-in logging contract for enabling or disabling logging after construction
- `QueueDefinition<S>` — type describing queue name and message JSON Schema
- `OutboundQueueDefinition<S>` / `InboundQueueDefinition<S>` — direction-tagged queue definition aliases
- `LoggingFieldSpec<TPayload>` — type describing one hardcoded or payload-derived logging field
- `QueueStorageConfig` — configuration type for constructing registered queue services, supporting `accountName`, `connectionString`, and optional managed-identity credential override
- `QueueLoggingConfig` — runtime logging configuration for registered queue services
- `QueueMessage<T>` — type for received queue messages
- `IQueueMessageLogger` / `MessageLogEnvelope` / `QueueMessageLogBlobStorage` — public logging contracts
- `FromSchema` / `JSONSchema` — `json-schema-to-ts` re-exports used by generated schema wrapper modules

## Core concepts

- `QueueDefinition`: describes a queue's logical name, the JSON Schema for messages, and optional logging tags and metadata.
- `defineQueue`: preferred authoring helper for queue definitions because it provides a typed `$payload` proxy without per-file setup noise.
- Schema wrapper generation: the bundled `cellix-generate-queue-schema-types` CLI converts `.schema.json` files into sibling `.schema.generated.ts` modules so payload types can be derived from JSON Schema without handwritten interfaces.
- `registerQueues`: accepts maps of outbound and inbound `QueueDefinition` objects and returns a typed registry. The registry exposes a `Service` class with lifecycle methods, opt-in logging controls, and typed queue methods already wired in the constructor — no separate bind step is required.
- `QueueStorageConfig`: supports both connection-string access and managed identity. Managed identity is the preferred production approach; connection strings remain supported for Azurite and consumers that explicitly need shared-key access.
- Blob-backed logging: consumers can pass a blob storage service directly to `enableLogging(...)`; the framework creates the internal queue-message logger adapter automatically.
- `Service` class pattern: consumer packages extend `registry.Service` to create an application-specific queue storage service. The queue bindings (producer methods, consumer methods) are applied automatically during construction via `Object.assign`. AJV validators are compiled once at `registerQueues()` call time and reused across instances.

## Package boundaries

This package is framework-level infrastructure. It must not contain application-specific queue names or schemas — those belong in consumer packages such as `@ocom/service-queue-storage`.

## Dependencies / relationships

- Depends on `@cellix/service-blob-storage` (or a blob-like adapter) for message payload persistence when logging is enabled.
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
