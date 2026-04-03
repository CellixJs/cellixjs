## Package framing

`@cellix/retry-policy` is a tiny framework package that builds retry schedules for consumers that need deterministic backoff behavior. This task is an internal refactor, not a contract expansion.

## Consumer usage exploration

Consumers only care that `createRetryPolicy()` yields stable retry delays for a given attempt limit and base delay. They do not consume or reason about the internal backoff calculator directly.

## Contract gate summary

The proposed surface remains a single root export, `createRetryPolicy(options)`, because this is an internal refactor with no intended contract change. Human review was not required; the gate outcome was to preserve the current public surface and keep the extracted backoff helper internal.

## Public contract

The root export remains `createRetryPolicy(options)`. The return shape and delay behavior remain stable across the refactor.

## Test plan

Preserve and strengthen public-entrypoint tests for the generated delay schedule before changing the internal calculator implementation. Do not import the internal helper from tests.

## Changes made

Extracted the backoff math into `src/internal/backoff.ts` and kept `src/index.ts` as the single public entrypoint. The existing contract tests remained unchanged except for broader schedule coverage.

## Documentation updates

Reviewed `manifest.md`, `README.md`, and TSDoc. No consumer-facing wording changed because the contract did not change, but the manifest still documents the internal boundary explicitly.

## Release hardening notes

The export surface remains unchanged and backward compatible. This work should not require a semver bump beyond an implementation patch, and the remaining risk is limited to performance regressions in extreme retry counts.

## Validation performed

Re-ran package-level public contract tests through the root entrypoint, confirmed the existing package tests still pass, verified the package build succeeds, and confirmed the docs still describe the same public export and usage pattern.
