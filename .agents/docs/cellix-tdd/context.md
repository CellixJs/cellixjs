# Temporary implementation context for `cellix-tdd`

## Purpose

`cellix-tdd` exists to help evolve `@cellix/*` framework packages toward public release and external consumption.

This is not just a test-first skill. It is a package maturity workflow.

## Core principle

Package design should emerge from expected consumer usage.

The skill should guide work through this loop:

consumer usage exploration → package intent alignment → public contract definition → TDD against public APIs only → implementation/refactor → documentation alignment → release hardening → validation

## Discovery and collaboration

The skill should inspect existing repo and package context first.

During the initial discovery phase, the skill should work to clarify:
- the package purpose
- intended consumers
- expected usage
- important success paths
- important failure and edge cases
- package boundaries and non-goals

If expected behavior, consumer usage, or package boundaries are materially unclear, the skill should collaborate with the user up front before authoring tests or implementation.

That clarified understanding should be captured in `manifest.md` and then used to derive the public contract and test plan.

The intended order is:

consumer usage discovery → manifest alignment → public contract → failing public-contract tests → implementation/refactor → documentation alignment → validation

## Expectations for `@cellix/*` packages`

Treat each package as a public product.

Bias toward:
- cohesive public APIs
- minimal intentional surface area
- intuitive naming
- clear errors and invariants
- strong documentation
- docs/test parity

## Testing rules

Tests must verify behavior only through documented public APIs.

Allowed:
- package entrypoint imports
- observable behavior assertions
- contract-focused unit/integration tests

Disallowed:
- deep imports into internals
- tests against private helpers
- assertions coupled to internal file structure
- implementation-detail testing unless it is part of the public contract

## Documentation rules

The skill must keep three layers aligned:
- `manifest.md` for maintainers
- `README.md` for consumers
- TSDoc for public exports at point of use

## Required skill output structure

- Package framing
- Consumer usage exploration
- Public contract
- Test plan
- Changes made
- Documentation updates
- Release hardening notes
- Validation performed

## Anti-patterns

Avoid:
- testing internals
- widening public surface casually
- undocumented public exports
- maintainers’ design rationale in README
- claiming release readiness without validation evidence