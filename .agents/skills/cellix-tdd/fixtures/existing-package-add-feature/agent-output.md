## Package framing

`@cellix/query-params` remains a small package for turning query-string values into typed, consumer-safe values. This task adds a boolean flag parser without expanding the package into full request validation.

## Consumer usage exploration

Consumers need to treat `?preview=true`, `?preview=1`, or a missing param as a simple boolean decision. They should not need to know about token tables or parsing helpers.

## Contract gate summary

- `parseStringList(input)` continues to serve multi-value query parsing from the package root.
- `parseBooleanFlag(input)` is proposed to serve the primary preview-flag success path without exposing token-normalization helpers.

Primary success-path snippet:

```ts
const preview = parseBooleanFlag(searchParams.get("preview"));
```

This is a clearly additive change to an established package, so no mandatory human stop was required. No uncertain exports were proposed.

## Public contract

The public surface stays at the package root. The new contract adds `parseBooleanFlag(input)` alongside `parseStringList(input)`, and invalid boolean text throws a `TypeError`.

## Test plan

Start with failing tests against `./index.ts` for accepted true values, accepted false values, nullish inputs, and invalid text. Keep tests at the public entrypoint only.

## Changes made

Added failing contract tests first, implemented `parseBooleanFlag`, and kept the token normalization logic internal to the function body instead of exporting helpers.

## Documentation updates

Updated `manifest.md` to mention boolean parsing in the intended API shape, updated `README.md` with usage examples, and added TSDoc for the public exports.

## Release hardening notes

Reviewed the export surface and kept the package root as the only public entrypoint. This is a backward-compatible minor addition with no deep exports added. Remaining risk is limited to downstream consumers depending on bespoke truthy strings that are still intentionally rejected.

## Validation performed

Validated the public contract with targeted Vitest coverage for the package entrypoint, re-ran the existing package tests, confirmed the package build passes, and manually checked that manifest, README, and TSDoc describe the same two exports.
