# @ocom/handler-queue-community-update manifest

## Purpose

Provides the Azure Functions Storage Queue trigger handler for the Owner Community `community-update` queue.

## Consumers

- `@apps/api` registers the exported handler creator with the local Cellix bootstrap.

## Public surface

- `communityUpdateQueueHandlerCreator(applicationServicesFactory)`

## Boundaries

- Owns queue-message validation and queue-specific update behavior.
- Depends on `@ocom/application-services` for system-scoped domain access.
- Depends on `@ocom/service-queue-storage` for the canonical `community-update` queue contract.
- Does not own Azure Functions bootstrap registration.
- Does not own queue transport/service lifecycle concerns.
