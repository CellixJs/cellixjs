# Cellix TDD Summary

Package: `@cellix/service-queue-storage`

Package path: `packages/cellix/service-queue-storage`

## Package framing

- Feature addition to an existing package: single-message processing for inbound queues on hosts without built-in queue delivery.
- The consumer is `@apps/video-worker`, which runs as an Azure Container Apps Job (ADR 0035). That host's scaler only starts executions; it does not dequeue, retry, or poison messages the way an Azure Functions queue trigger does.
- `manifest.md` already existed and was updated with the new scope, a non-goal, and the core concept.

## Consumer usage exploration

- A job execution calls `processNextFrom<Key>Queue(handler, options)` once and exits. A local worker calls it in a loop.
- The handler may run for tens of minutes (ffmpeg), so the message must stay hidden for the whole run.
- A crashed process must release the message within one visibility timeout, and a stopped process (SIGTERM) should release it immediately.
- Some failures will never succeed on retry (missing source). These must be poisoned rather than retried five times, so the caller classifies errors.
- Invalid payloads must not reach the handler.
- Every inbound message must still be validated and logged exactly as `receiveFrom<Key>Queue` does.
- Downstream dependents: `@ocom/service-queue-storage` (registry) and `@apps/api` (bootstrap). Both gain the method on inbound queues. Nothing is removed or renamed.

## Contract gate summary

The user chose where the code lives: a framework method rather than a worker-local adapter. The exact surface is additive and was recorded here, without a separate review, as the skill allows for low-risk additive changes.

- `processNextFrom<Key>Queue(handler, options?)`, generated for each inbound queue on `QueueConsumerContext`: receives, validates, logs, runs the handler with a visibility heartbeat, then deletes, retries, or poisons one message.
- `QueueMessageHandler<T>`: the handler signature, `(message, { signal }) => Promise<void>`.
- `ProcessQueueMessageOptions`: visibility timeout, heartbeat interval, max dequeue count, poison queue name, retry delay, `isPermanentFailure`, and `signal`.
- `ProcessQueueMessageResult`: the outcome union, `empty | completed | retrying | poisoned | lost`.

```ts
const result = await service.processNextFromEncodeVideoQueue(handler, {
	visibilityTimeoutSeconds: 600,
	isPermanentFailure: isPermanentEncodingFailure,
	signal: shutdown.signal,
});
```

No exports are uncertain. Raw receive, update, and delete stay off the public type, which keeps ADR 0033's "not a polling abstraction" stance.

## Public contract

- Validation uses the same Ajv validator and inbound logging path as `receiveFrom<Key>Queue`.
- Defaults: visibility 300 s, heartbeat a third of visibility, maximum 5 dequeues, poison queue `<queueName>-poison` (created on first use), retry delay 0.
- A heartbeat interval that is not shorter than the visibility timeout rejects before any message is received.
- A failed renewal aborts the handler's signal and the result is `lost`; the message is not deleted.
- A caller abort releases the message with visibility 0, and the result is `retrying`.
- Internal: `InternalQueueStorageService.updateMessageVisibility` (on the internal transport type only) and the `processNextMessage` implementation.

## Test plan

- `src/queue-processor.test.ts` (16 tests) was written before the implementation. It imports only from `./index.ts`, the package entrypoint, the same convention as the existing tests.
- It uses an in-memory fake of `@azure/storage-queue` that models visibility timeouts, pop receipts, dequeue counts, and 404 on a stale pop receipt.
- Scenarios covered:
  - empty queue
  - success and delete
  - hidden from a second receiver during processing
  - heartbeat renewal across ten minutes, with fake timers
  - transient retry, and retry delay
  - permanent failure poisoned
  - invalid payload poisoned without running the handler
  - max dequeue count exceeded
  - custom maximum and poison queue name
  - heartbeat failure reported as `lost`
  - caller abort releases the message
  - inbound logging
  - heartbeat option validation
  - not started
- No existing tests were duplicated. Payload validation is reused, and its error formatting stays covered by the existing consumer tests.

## Changes made

- `src/queue-processor.ts`: the processing algorithm and the three public types.
- `src/queue-consumer.ts`: generates `processNextFrom<Key>Queue` and shares the receive function with `receiveFrom<Key>Queue`.
- `src/internal-queue-storage-service.ts`: `updateMessageVisibility`, which wraps `QueueClient.updateMessage`.
- `src/register-queues.ts`: a consumer stub for the new method.
- `src/index.ts`: type exports.

## Documentation updates

- README: a new section on processing the next message, with the steps, defaults, a result status table, and an idempotency note. Exports list updated.
- `manifest.md`: scope, non-goals (no polling loops or schedulers), public API list, core concept (two inbound delivery modes), and testing strategy.
- TSDoc on `QueueMessageHandler`, `ProcessQueueMessageOptions` (every property), `ProcessQueueMessageResult` (every status), and the generated method on `QueueConsumerContext`, with an example.
- ADR 0033 notes the amendment, and ADR 0035 describes the framework method.

## Release hardening notes

- The export surface change is additive: three types, plus one generated method per inbound queue. Semver: minor, backward compatible. No dependents break, and the dependent builds were re-run.
- Remaining risk and follow-up work:
  - It is verified only against the in-memory fake and an Azurite run of the worker, not yet against a real Azure storage account. The SDK's `updateMessage` and pop-receipt semantics are assumed to match Azurite.
  - Poison queues are written to but not monitored or replayed.
  - The `test:integration` script in `package.json` points to a file that does not exist. This predates this change.

## Validation performed

I ran the following after the final code change:

- Package build (`pnpm run build`: lint and tsgo) passed.
- Package tests (`pnpm run test`, 135 tests including the 16 new ones) passed, and type checks are clean.
- Coverage: `queue-processor.ts` 93.75% statements. Uncovered lines are defensive: a failed release, a signal already aborted before the handler, and a renewal after loss.
- Wider verification:
  - `turbo run build` for all dependents of `@cellix/service-queue-storage` and `@ocom/service-queue-storage`: 37/37 passed.
  - `turbo run test` for the same set: passed, except `@ocom/graphql`. Its `staff-user.resolvers.test.ts` fails on a pre-existing Cucumber step mismatch in files this change does not touch.
- End to end against Azurite with real ffmpeg: one message encoded and deleted, a missing-source message poisoned to `encode-video-poison`, loop mode via `pnpm run dev:video-worker`, and SIGTERM during encoding releasing the message (dequeue count 1, visible immediately).
