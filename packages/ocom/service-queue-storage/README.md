# @ocom/service-queue-storage

Application queue registration for OCOM. This package is the consumer-facing place to add queues, bind their payload schemas, and expose the generated queue service methods used by the application and verification suites.

## What lives here

- Queue definitions for OCOM outbound and inbound queues
- The registered `ServiceQueueStorage` class built from those definitions
- Exported payload types inferred from each queue schema

`@cellix/service-queue-storage` provides the framework primitives. This package is where OCOM chooses its actual queue names and keys.

## Add a queue

1. Create a schema-backed queue definition under `src/schemas/inbound/` or `src/schemas/outbound/`.
2. Add or update the sibling queue-definition `.ts` file.
3. Run `pnpm run gen` to generate the typed `.schema.generated.ts` wrapper from the JSON schema.
4. Import `schema` and `type Schema` from the generated module.
5. Build the queue with `defineQueue<Payload>()`.
6. Register it in `src/registry.ts` under the appropriate `outbound` or `inbound` map.
7. Register the two maps with `registerQueues(...)`.
8. Export the concrete `ServiceQueueStorage` constructor and the `QueueStorageOperations` type for code that only needs queue methods.
9. Use the generated methods through `ServiceQueueStorage` at startup or `QueueStorageOperations` for injected application services.

`ApiContextSpec` should depend on `QueueStorageOperations`, not `ServiceQueueStorage`. The constructor is for bootstrap; the operations type is for application-service injection.

Example:

```ts
import { defineQueue } from '@cellix/service-queue-storage';
import { schema as memberInvitedSchema, type Schema as MemberInvitedPayload } from './member-invited.schema.generated.ts';

export const memberInvitedQueue = defineQueue<MemberInvitedPayload>()(({ $payload }) => ({
	queueName: 'member-invited',
	schema: memberInvitedSchema,
	loggingTags: { domain: 'community', memberId: $payload.memberId },
	loggingMetadata: { communityId: $payload.communityId },
}));
```

The generated wrapper comes from a sibling `member-invited.schema.json` file. `pnpm run gen` is already wired into `prebuild` so local builds stay in sync.

Then register it:

```ts
import { createRegisteredQueueService, registerQueues } from '@cellix/service-queue-storage';
import type { QueueRegistryOperations } from '@cellix/service-queue-storage';

const outboundQueues = {
	communityCreation: communityCreationQueue,
	memberInvited: memberInvitedQueue,
};

const inboundQueues = {
	endUserUpdate: endUserUpdateQueue,
};

const queues = registerQueues({
	outbound: outboundQueues,
	inbound: inboundQueues,
});

export const ServiceQueueStorage = createRegisteredQueueService(queues);
export type ServiceQueueStorage = InstanceType<typeof ServiceQueueStorage>;
export type QueueStorageOperations = QueueRegistryOperations<typeof queues>;
```

## Key, queue name, and method name

There are three related names for every queue:

- Registry key: the property name in `outboundQueues` or `inboundQueues`
- Queue name: the Azure Queue Storage name inside the queue definition
- Generated method: the service method produced from the registry key

Example:

- key: `communityCreation`
- queue name: `community-creation`
- producer method: `sendMessageToCommunityCreationQueue(...)`
- consumer peek method: `peekAtCommunityCreationQueue(...)`

The generated method name comes from the key, not the physical queue name. Use concise domain nouns for keys and avoid ending keys with `Queue`, otherwise the generated method will stutter.

## Provisioning and local development

`registerQueues(...)` provisions all registered queue names by default for local startup. Consumers only need `serviceDefaults.provisionQueues` when they intentionally want to provision a subset. Production queue lifecycle remains outside this package.

## Runtime logging config

Queue topology lives in this package, but runtime logging policy does not. Settings such as the blob log container, whether queue logging is enabled, and whether the app should await logging are owned by the host application bootstrap layer, for example `apps/api/src/service-config/queue-storage/index.ts`.

## Verification

- `acceptance-api` can satisfy queue scenarios with mocked queue infrastructure.
- `e2e-tests` exercise the real registered `ServiceQueueStorage` path against Azurite.

If you add a queue that participates in shared verification scenarios, update `packages/ocom-verification` step definitions to assert the new behavior through the same service boundary.
