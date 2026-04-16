## Package framing

`@cellix/network-endpoint` is a small utility package for normalizing host and port configuration values. This snapshot represents a package-hardening pass on an existing contract rather than a feature expansion.

## Consumer usage exploration

Consumers need predictable host and port normalization when reading configuration from environment variables or deployment settings. They care about valid defaults and range checking, not about internal parsing helpers.

## Contract gate summary

- `parseHost(input)` remains the root export for normalizing optional host values into a concrete hostname.
- `parsePort(input)` remains the root export for validating and normalizing a TCP port value.

Primary success-path snippet:

```ts
import { parseHost, parsePort } from "@cellix/network-endpoint";
```

Human review was not required because the public surface did not change. The main gate conclusion was that the tests should identify each export explicitly instead of remaining flat and ambiguous.

## Public contract

The package keeps a root-only contract with `parseHost(input)` and `parsePort(input)`. `parseHost` returns a hostname string with a sensible default, and `parsePort` returns a validated numeric port or throws on invalid values.

## Test plan

The tests should stay at the package root import and be grouped by exported member so `parseHost` and `parsePort` each have clearly named suites that cover their main success and failure behavior.

## Changes made

This snapshot still uses flat tests whose titles describe the behavior but do not identify the exported member under test.

## Documentation updates

The manifest, README, and TSDoc all describe the same root-only contract and consumer usage.

## Release hardening notes

The export surface remains backward compatible and intentionally narrow. The remaining risk is test readability and reviewability because the current suite does not make the export under test obvious yet.

## Validation performed

Ran targeted Vitest checks through the root entrypoint, re-ran the existing package tests, and verified the package build still succeeds with the shipped root exports.
