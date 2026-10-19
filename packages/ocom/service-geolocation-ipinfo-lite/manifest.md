# Package Manifest

## Purpose

Provide country-level IP geolocation through IPinfo Lite's HTTPS API while implementing `@cellix/service-geolocation-base`.

## Scope

Validate IPv4 and IPv6 addresses, call the Lite endpoint with a Bearer token through an injectable Fetch implementation, and normalize country code and country name.

## Non-goals

This package does not manage a local dataset, select providers, decide proxy trust, persist lookup results, or infer city-level fields that Lite does not provide.

## Public API shape

`ServiceGeolocationIpInfoLite` implements the shared geolocation service. `IpInfoLiteOptions` configures the required token and optional timeout.

## Core concepts

Startup enables lookups; shutdown disables them. Invalid IP addresses are rejected before network access. A missing country record returns `null`; provider HTTP failures are surfaced as errors.

## Package boundaries

The package owns input validation, HTTPS transport, provider error handling, and response normalization. Provider selection and caller policy remain outside the adapter.

## Dependencies / relationships

The implementation depends on `@cellix/api-services-spec` for service lifecycle and `@cellix/service-geolocation-base` for the provider-neutral lookup contract. It uses the runtime Fetch API and has no provider SDK dependency.

## Testing strategy

Vitest tests import the package entrypoint and inject Fetch responses. Cover country mapping, Bearer authentication, IPv4/IPv6, no-data results, lifecycle and input errors, HTTP failures, and invalid provider responses.

## Documentation obligations

Keep the README aligned with token handling, Lite's country-level fields, IPv4/IPv6 support, attribution, and the absence of a local database requirement.

## Release-readiness standards

The package must build, pass its Vitest suite and Biome lint, and retain HTTPS-only requests without exposing the configured token in the URL.