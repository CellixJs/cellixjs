# @cellix/command-router Manifest

## Purpose

Provide a tiny command router for framework packages that dispatch named handlers.

## Scope

Command registration, normalized dispatch keys, and deterministic lookup behavior.

## Non-goals

This package does not own transport adapters or command authorization.

## Public API shape

Expose `createCommandRouter` from the root entrypoint and keep route-key helpers internal.

## Core concepts

Command names normalize to predictable lookup keys before dispatch.

## Package boundaries

Normalization helpers remain internal implementation details.

## Dependencies / relationships

Other `@cellix/*` packages can use the router while treating normalization as private behavior.

## Testing strategy

Verify registration and dispatch through root-entrypoint tests only.

## Documentation obligations

Keep the manifest, README, and public-export TSDoc aligned whenever the router contract changes.

## Release-readiness standards

The package must keep a narrow public surface and contract-focused tests before release.
