# @cagematch/rate-limiting-redis Manifest

## Purpose

Implement the cage-match fixed-window counter with one atomic Redis Lua operation.

## Scope

- Atomic create/increment/deny decisions with key expiry
- Redis client lifecycle integration
- Validation and normalization of script responses

## Non-goals

- Policy selection, application identity, Redis client construction, or authorization
- General-purpose Redis commands or cache behavior

## Public API shape

Export `RedisRateLimitStore`, `ServiceRedisRateLimiting`, and the narrow command-client contract from the package root.

## Core concepts

One Lua script owns each counter decision. The facade-generated key contains the fixed-window timestamp, while Redis expiry removes stale keys.

## Package boundaries

Lua and Redis command details stay here. Shared policy behavior stays in `@cagematch/rate-limiting`.

## Dependencies / relationships

Implements contracts from `@cagematch/rate-limiting` and accepts a client supplied by application composition.

## Testing strategy

Verify script invocation, malformed responses, lifecycle, limits, subject isolation, and window reset through root exports.

## Documentation obligations

Keep `README.md`, public TSDoc, and this manifest aligned with client requirements and lifecycle behavior.

## Release-readiness standards

The adapter must pass the shared behavioral contract and a real Redis integration run before cage-match measurement.
