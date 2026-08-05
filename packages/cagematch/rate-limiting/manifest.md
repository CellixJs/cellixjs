# @cagematch/rate-limiting Manifest

## Purpose

Provide the backend-neutral feature rate-limiting contract and Cellix lifecycle facade used to compare storage contenders fairly.

## Scope

- Fixed-window policy resolution by feature, optional account type, and optional stable staff role
- Counter key construction, request validation, and normalized decisions
- A lifecycle facade that delegates to one selected implementation

## Non-goals

- Choosing MongoDB or Redis at runtime
- Owning application policy values, HTTP identity extraction, or authorization
- Treating tenant-defined community roles as traffic classes
- Implementing sliding-window or token-bucket algorithms during the fixed-window cage match

## Public API shape

Consumers import facade, policy, request, decision, subject, and store contracts from `@cagematch/rate-limiting`. Storage mechanics remain in contender packages.

## Core concepts

Feature is the primary policy selector. Account type may refine capacity; staff role is the most-specific optional override. A missing policy allows the feature without touching storage.

## Package boundaries

Policy configuration belongs to the application composition root. Adapter-specific clients, commands, and documents do not belong here.

## Dependencies / relationships

Depends on `@cellix/api-services-spec` for lifecycle integration. MongoDB and Redis contenders implement its public store and service contracts.

## Testing strategy

Test policy precedence, validation, key isolation, retry metadata, and lifecycle behavior through the package root.

## Documentation obligations

Keep this manifest, `README.md`, and public TSDoc aligned whenever selectors or decisions change.

## Release-readiness standards

The public surface must remain backend-neutral, deterministic, documented, and verified by both contender contract suites.
