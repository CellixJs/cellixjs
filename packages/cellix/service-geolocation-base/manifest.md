# Purpose

Define the provider-neutral server-side IP geolocation contract used by Cellix applications and OCOM adapters.

# Scope

- Provider-neutral `GeolocationService` facade interface.
- Normalized optional location fields in `GeolocationLookupResult`.
- Shared semantics for unknown addresses and lookup failures.

# Non-goals

- Selecting or validating the request IP or trusted proxy chain.
- Implementing a geolocation provider, persistence, caching, or retry policy.
- Treating approximate network location as a precise physical address.

# Public API shape

- `GeolocationService` identifies its provider and exposes `lookup(ip)`. `GeolocationInfrastructureService` adds the `ServiceBase` lifecycle from `@cellix/api-services-spec`; composition roots register and resolve providers through this type.
- `GeolocationLookupResult` contains optional normalized fields and provider identity.

# Core concepts

An unknown address resolves to `null`; operational lookup failures reject. Callers decide whether to continue and whether to persist either outcome.

# Package boundaries

Provider SDK and database types remain in concrete adapters. Application services depend on this contract, not those adapters.

# Dependencies / relationships

Depends only on `@cellix/api-services-spec` (types). OCOM adapters (currently `@ocom/service-geolocation-ipinfo-lite`) implement the contract; the API composition root selects one.

# Testing strategy

Verify consumer compatibility and result/null semantics through the package entrypoint and typecheck concrete adapter implementations against the interface.

# Documentation obligations

Keep this manifest, the consumer README, and public TSDoc aligned when changing exports or behavior.

# Release-readiness standards

Build and test the package, verify adapter compatibility, and review the public contract before publishing.