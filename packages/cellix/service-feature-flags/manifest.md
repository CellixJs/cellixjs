# @cellix/service-feature-flags Manifest

## Purpose

`@cellix/service-feature-flags` provides a framework-owned infrastructure
service for retrieving and validating a shared feature-flag document.

## Scope

- A typed feature-flag document contract
- Validation of JSON documents retrieved from an injected text source
- Lifecycle methods compatible with Cellix infrastructure registration
- Optional application-provided fallback documents

## Non-goals

- Azure Blob SDK usage or storage-client construction
- Application environment-variable names, blob names, or container policies
- Application feature-flag values and rollout policy
- UI feature-flag fetching or rendering

## Public API shape

- `ServiceFeatureFlags` is the framework infrastructure service
- `FeatureFlagTextSource` is the deliberately narrow storage dependency port
- Payload, option, address, and lifecycle operation types are exported from the package root

## Core concepts

- A feature-flag document has a required `FeatureFlags` array; individual flags
	require `Name` and `Value` and may add descriptive metadata.
- A `FeatureFlagTextSource` resolves text for an application-selected address.
	`undefined` means the document does not exist and activates the fallback.
- `ServiceFeatureFlags` parses and validates the source or fallback document,
	without owning the source client lifecycle.

## Package boundaries

- The package owns feature-flag document validation and fallback selection.
- Applications own source construction, environment resolution, container/blob
	names, application flag values, and rollout policy.
- Azure SDK clients, source-specific error handling, and UI state remain outside
	this package.

## Dependencies / relationships

- Depends on `@cellix/api-services-spec` for Cellix service lifecycle conventions
- Depends on `ajv` to validate the public feature-flag document contract
- Applications adapt blob storage or another document store to `FeatureFlagTextSource`

## Testing strategy

- Test package behavior through the package root entrypoint
- Cover source document retrieval, fallback behavior, and schema validation

## Documentation obligations

- Keep `README.md` focused on standalone application consumers and root imports.
- Keep public TSDoc synchronized with the package entrypoint exports.
- Update this manifest when document semantics, source boundaries, or lifecycle
	behavior change.

## Release-readiness standards

- Keep storage and application configuration outside the package
- Do not expose Azure SDK clients or environment access through the public API
- Keep README, manifest, TSDoc, and entrypoint exports aligned