# @cagematch/rate-limiting-redis Manifest

## Purpose

Implement the cage-match fixed-window counter with one atomic Redis Lua operation.

## Scope

- Atomic create/increment/deny decisions with key expiry
- Typed Node Redis script registration and cache-miss recovery
- Dedicated Redis client construction
- Redis client lifecycle integration
- Validation and normalization of script responses
- Mandatory Redis error-event handling with an application override

## Non-goals

- Policy selection, application identity, or authorization
- General-purpose Redis commands or cache behavior

## Public API shape

Export `createRedisRateLimitingClient`, `ServiceRedisRateLimiting`, and their narrow client/options types from the package root. Keep the store and script definition internal.

## Core concepts

One registered command owns each counter decision. The raw Lua algorithm, Node Redis protocol mapping, and storage orchestration live in separate modules so each concern can be read independently. Node Redis uses `EVALSHA` with automatic `NOSCRIPT` recovery. The facade-generated key contains the fixed-window timestamp, while Redis expiry removes stale keys.

## Package boundaries

Lua and Redis command details stay here. Shared policy behavior stays in `@cagematch/rate-limiting`.

## Dependencies / relationships

Implements contracts from `@cagematch/rate-limiting` and constructs a dedicated client from the application-supplied Node Redis options.

## Testing strategy

Verify registered-client construction, malformed responses, lifecycle, limits, subject isolation, and window reset through root exports. Use a real Redis integration test to prove the registered script behavior.

## Documentation obligations

Keep `README.md`, public TSDoc, and this manifest aligned with client requirements and lifecycle behavior.

## Release-readiness standards

The adapter must pass the shared behavioral contract and a real Redis integration run before cage-match measurement.
