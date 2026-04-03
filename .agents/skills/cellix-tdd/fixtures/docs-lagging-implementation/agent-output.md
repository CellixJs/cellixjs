## Package framing

`@cellix/env-reader` provides tiny environment-variable readers for framework packages. The package is still meant to be public-facing, even though its current docs drifted behind the implementation.

## Consumer usage exploration

Consumers need a safe way to require or optionally read environment values without repeating null checks. They care about predictable errors and defaults, not about process-level implementation details.

## Contract gate summary

The proposed surface stays with the existing root exports for required and optional environment reads, because the task is docs alignment rather than contract expansion. Human review was not required here; the main gate note is that no new exports should be added to paper over the documentation drift.

## Public contract

The package exposes two root-level helpers for required and optional environment reads. There are no public subpath exports.

## Test plan

Public-contract tests should cover missing required variables, optional reads, and default handling through the package root only.

## Changes made

This snapshot shows a package where behavior exists but the docs were not brought back into alignment yet.

## Documentation updates

Documentation still needs to be updated so the README explains current usage and the public exports have consistent API docs.

## Release hardening notes

The current behavior remains backward compatible and keeps the same root-only public surface, but the blocking release risk is stale consumer docs and export-level docs that have not caught up with the shipped behavior.

## Validation performed

Ran targeted Vitest coverage against the root entrypoint, re-ran the existing package tests, confirmed the package build still passes, and then inspected the docs gap that remains unresolved.
