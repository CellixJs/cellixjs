## Package framing

`@cellix/command-router` maps command names to handlers for framework consumers. The package should expose routing behavior without publishing helper internals.

## Consumer usage exploration

Consumers care about registering commands and dispatching by name. They should not need to understand how route keys are normalized internally.

## Contract gate summary

The proposed surface stays at `createCommandRouter()` from the package root because the route-key normalizer does not serve a standalone consumer need. Human review was not required for the surface itself; the gate outcome was simply to keep the helper private and reject the convenience of testing it directly.

## Public contract

The package exposes `createCommandRouter()` from the root entrypoint and keeps route-key normalization private.

## Test plan

Public tests should exercise router registration and dispatch through the root entrypoint contract.

## Changes made

This snapshot includes a convenience test import of the internal route-key helper, which violates the intended testing rule.

## Documentation updates

The manifest, README, and TSDoc all describe the root router export and not the helper implementation.

## Release hardening notes

The public surface stays root-only and backward compatible. The remaining release risk is the test coupling to an internal file, which should be removed before treating the package as ready.

## Validation performed

Validated root-entrypoint behavior with Vitest and noted the internal-helper import that still needs to be removed from the tests.
