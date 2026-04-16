## Package framing

`@cellix/http-headers` is intended to offer small header-merging helpers to framework consumers. The package should stay focused on merge behavior rather than exporting implementation helpers.

## Consumer usage exploration

Consumers need a predictable way to merge default and request headers without worrying about case normalization details. They should not have to import the normalizer directly.

## Contract gate summary

- `mergeHeaders(base, incoming)` should remain the only consumer-facing export because it serves the actual header-merging use case.
- `./internal-normalizer` is uncertain and should be treated as a removal candidate because it exposes implementation detail rather than a distinct consumer need.

Primary success-path snippet:

```ts
const merged = mergeHeaders(defaultHeaders, requestHeaders);
```

Human review is warranted here because narrowing the surface would remove an existing export path that downstream dependents might already consume.

## Public contract

The intended consumer contract is `mergeHeaders(base, incoming)` from the package root.

## Test plan

Public tests should continue importing from the root entrypoint while checking case-insensitive merges and override behavior.

## Changes made

This snapshot still exposes an internal normalizer subpath even though the intended contract is root-only.

## Documentation updates

The manifest and README continue to describe the root merge helper for consumers.

## Release hardening notes

This section was not completed before this snapshot was recorded.

## Validation performed

Ran the root-entrypoint Vitest checks, re-ran the existing package tests, confirmed the package build passes, and then noted that the package still ships an unnecessary public subpath.
