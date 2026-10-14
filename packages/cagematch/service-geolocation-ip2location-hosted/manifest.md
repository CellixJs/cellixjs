# Package Manifest

## Purpose

Provide hosted IP geolocation through the IP2Location.io REST API while implementing `@cellix/service-geolocation-base`.

## Scope

Validate IP addresses, call the HTTPS JSON endpoint through an injectable fetch function, and normalize the provider's basic location fields.

## Non-goals

This package does not select providers, decide proxy trust, persist lookup results, or expose provider-specific fields beyond the shared location contract.

## Public API shape

`ServiceGeolocationIp2LocationHosted` implements the shared geolocation service. `Ip2LocationHostedOptions` configures an optional API key and timeout. `FetchLike` allows consumers to provide a compatible transport.

## Core concepts

Startup enables lookups; shutdown disables them. Valid IPv4 and IPv6 addresses are sent to IP2Location.io, and missing location data is returned as `null`.

## Package boundaries

The package owns only transport, input validation, provider error handling, and response normalization. Provider selection and caller policy remain outside the adapter.

## Dependencies / relationships

The implementation depends on `@cellix/api-services-spec` for service lifecycle and `@cellix/service-geolocation-base` for the provider-neutral lookup contract. It uses the runtime Fetch API and has no provider SDK dependency.

## Testing strategy

Vitest tests import the package entrypoint and inject `FetchLike` responses. Cover field mapping, IPv4/IPv6, no-data results, invalid lifecycle/input, HTTP failures, and provider error objects.

## Documentation obligations

Keep the README aligned with keyless access, authentication, timeout behavior, supported address families, and returned fields.

## Release-readiness standards

The package must build, pass its Vitest suite and Biome lint, and retain HTTPS-only requests without exposing configured API keys in URLs.