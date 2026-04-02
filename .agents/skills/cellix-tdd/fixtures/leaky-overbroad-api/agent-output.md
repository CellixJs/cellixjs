## Package framing

`@cellix/http-headers` is intended to offer small header-merging helpers to framework consumers. The package should stay focused on merge behavior rather than exporting implementation helpers.

## Consumer usage exploration

Consumers need a predictable way to merge default and request headers without worrying about case normalization details. They should not have to import the normalizer directly.

## Public contract

The intended consumer contract is `mergeHeaders(base, incoming)` from the package root.

## Test plan

Public tests should continue importing from the root entrypoint while checking case-insensitive merges and override behavior.

## Changes made

This snapshot still exposes an internal normalizer subpath even though the intended contract is root-only.

## Documentation updates

The manifest and README continue to describe the root merge helper for consumers.

## Release hardening notes

Release readiness still needs a deliberate review because this snapshot is exporting more than the intended contract.

## Validation performed

Ran the root-entrypoint Vitest checks and confirmed they pass, then noted that the package still ships an unnecessary public subpath.
