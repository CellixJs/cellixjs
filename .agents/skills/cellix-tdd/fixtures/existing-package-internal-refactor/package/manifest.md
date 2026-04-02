# @cellix/retry-policy Manifest

## Purpose

Provide deterministic retry schedules for framework code that needs bounded retries.

## Scope

Policy creation, delay schedule generation, and retry-related invariants.

## Non-goals

This package does not send requests or wrap transport clients.

## Public API shape

Expose `createRetryPolicy` from the package root and keep backoff helpers internal.

## Core concepts

Retry attempts are bounded, delays are deterministic, and policy objects are immutable snapshots.

## Package boundaries

Consumers should only interact with the root export. Internal backoff math stays private.

## Dependencies / relationships

Other `@cellix/*` packages may consume the generated schedules but should not depend on internal helpers.

## Testing strategy

Contract tests exercise the root entrypoint and the observable delay schedule only.

## Documentation obligations

Keep manifest, README, and TSDoc aligned whenever the contract changes.

## Release-readiness standards

Public behavior must remain deterministic, documented, and validated through the package entrypoint.
