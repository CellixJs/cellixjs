# @cellix/http-headers Manifest

## Purpose

Provide small helpers for merging HTTP header maps.

## Scope

Normalize and merge header records for framework consumers.

## Non-goals

This package does not own HTTP clients or request builders.

## Public API shape

Expose `mergeHeaders` from the root entrypoint and keep normalization helpers internal.

## Core concepts

Header names are case-insensitive and merged predictably.

## Package boundaries

Normalization helpers should remain private implementation details.

## Dependencies / relationships

Other `@cellix/*` packages may reuse the merge helper when building request adapters.

## Testing strategy

Verify merges through root-entrypoint tests only.

## Documentation obligations

Keep the manifest, README, and public-export TSDoc aligned when the merge contract changes.

## Release-readiness standards

The public surface must stay narrow and free of internal helper exports.
