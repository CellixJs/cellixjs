---
name: queue-authoring
description: >
  Author and maintain CellixJS queue registrations. Use when adding or updating
  queue definitions in application packages that consume
  @cellix/service-queue-storage, including schema-derived payload types,
  registry wiring, generated method names, documentation, and verification.
license: MIT
compatibility: Works with CellixJS queue packages built on @cellix/service-queue-storage
metadata:
  author: CellixJS Team
  version: "1.0"
  repository: https://github.com/CellixJs/cellixjs
allowed-tools: Bash(node:*) Bash(pnpm:*) Read Write Edit Glob Grep
---

# Queue Authoring

Use this skill when working on consumer queue packages such as `@ocom/service-queue-storage`.

## Goals

- Keep queue payload types derived from the queue schema instead of maintained separately.
- Keep the registry key, physical queue name, and generated service method aligned.
- Keep verification scenarios reusable across acceptance and e2e suites.
- Keep queue package docs current so consumers can add queues without reading framework internals.

## Authoring Workflow

1. Inspect the existing queue package first.
2. Add or update the queue definition in `src/schemas/inbound/` or `src/schemas/outbound/`.
3. Keep the payload schema in a colocated `.schema.json` file.
4. Generate the sibling `.schema.generated.ts` wrapper with `cellix-generate-queue-schema-types` or the package `gen` script.
5. Import `schema` and `type Schema` from the generated module.
6. Build the queue with `defineQueue<Payload>()(({ $payload }) => ({ ... }))`.
7. Register outbound and inbound queue maps with `registerQueues(...)`.
8. Export the registered service with `createRegisteredQueueService(queues)` and the operations type with `QueueRegistryOperations<typeof queues>`.
9. Confirm the registry key produces the intended generated method name.
10. Update consumer docs and any shared verification scenarios that depend on the queue.

## Required Conventions

- Prefer `.schema.json` files as the source of truth plus generated `.schema.generated.ts` wrappers. Do not maintain a separate handwritten TS interface.
- Use concise domain-noun registry keys such as `communityCreation`.
- Do not end registry keys with `Queue` unless the generated method name should also repeat `Queue`.
- Keep Azure queue names explicit and kebab-cased, for example `community-creation`.
- Prefer `$payload.<field>` for logging tags and metadata rather than raw `{ payloadField: ... }` objects.
- Let `registerQueues(...)` provision all registered queues by default. Only override `serviceDefaults.provisionQueues` for an intentional subset.

## Naming Model

Every queue has three names:

- Registry key: `communityCreation`
- Physical queue name: `community-creation`
- Generated method: `sendMessageToCommunityCreationQueue(...)`

The generated method always comes from the registry key, not the physical queue name.

## Verification Expectations

- `acceptance-api` may verify queue side effects with mocked queue infrastructure.
- `e2e-tests` should use the application's real registered queue service path, not a duplicated raw Azure SDK helper.
- Shared scenarios in `packages/ocom-verification/verification-shared` remain the source of truth when the behavior should be exercised across suites.

## Validation Checklist

- Package builds successfully.
- Queue package tests pass.
- Any affected verification suites pass.
- README documents the queue authoring flow and naming relationship.
