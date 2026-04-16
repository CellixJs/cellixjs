# @cellix/query-params Manifest

## Purpose

Provide small query-string parsing helpers for framework packages and adapters.

## Scope

Typed parsing of individual query parameter values and simple list forms.

## Non-goals

This package does not perform request validation or schema orchestration.

## Public API shape

Expose root-level helpers such as `parseBooleanFlag` and `parseStringList` from the package entrypoint.

## Core concepts

Inputs should be nullable, parsing should be explicit, and invalid text should fail loudly.

## Package boundaries

Normalization helpers and token tables stay internal.

## Dependencies / relationships

This package is dependency-light and intended for reuse by other `@cellix/*` packages.

## Testing strategy

Verify observable behavior through root-entrypoint tests only.

## Documentation obligations

Keep this manifest, the consumer README, and public-export TSDoc aligned.

## Release-readiness standards

Every exported parser must be documented, tested through the public API, and safe for external consumers.
