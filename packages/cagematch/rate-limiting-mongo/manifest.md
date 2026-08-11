# @cagematch/rate-limiting-mongo Manifest

## Purpose

Implement the cage-match fixed-window counter with atomic MongoDB operations and TTL cleanup.

## Scope

- Atomic conditional increments
- Duplicate-key retry for concurrent first writes and exhausted counters
- Exact remaining-capacity reporting for denied weighted requests
- TTL index creation and Cellix lifecycle integration

## Non-goals

- Policy selection, application identity, MongoDB connection ownership, or authorization
- Requiring application code to define the collection name or document shape

## Public API shape

Export `MongoRateLimitStore`, `ServiceMongoRateLimiting`, and narrow database/collection/document/options contracts from the package root. Normal application composition supplies only the database handle.

## Core concepts

Each facade-generated key is one fixed-window document. The conditional increment prevents the stored count from exceeding its limit; TTL deletion is cleanup rather than reset correctness.

## Package boundaries

MongoDB update and index details stay here. Shared policy behavior stays in `@cagematch/rate-limiting`.

## Dependencies / relationships

Implements contracts from `@cagematch/rate-limiting` and accepts a collection supplied by application composition.

## Testing strategy

Verify command shape, duplicate-key recovery, lifecycle, limits, subject isolation, and window reset through root exports.

## Documentation obligations

Keep `README.md`, public TSDoc, and this manifest aligned with collection requirements and lifecycle behavior.

## Release-readiness standards

The adapter must pass the shared behavioral contract and a real MongoDB integration run before cage-match measurement.
