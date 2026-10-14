# Package Manifest

## Purpose

Provide local IP geolocation through an official IP2Location BIN database and implement `@cellix/service-geolocation-base`.

## Scope

Open and close a configured BIN reader, validate IPv4/IPv6 input, and normalize country, region, city, and coordinate fields.

## Non-goals

This package does not parse BIN files, download or update databases, select providers, or persist lookup results.

## Public API shape

`ServiceGeolocationIp2LocationBin` implements the shared service. `Ip2LocationBinOptions` configures the BIN path. `Ip2LocationBinReader` and `Ip2LocationBinReaderFactory` define the narrow injectable reader boundary.

## Core concepts

The official reader's asynchronous API is initialized during startup and released during shutdown. Database coverage determines whether IPv6 lookups are supported.

## Package boundaries

BIN parsing belongs to the official `ip2location-nodejs` dependency. The adapter owns only lifecycle coordination, validation, provider error translation, and result normalization.

## Dependencies / relationships

The package depends on `@cellix/api-services-spec`, `@cellix/service-geolocation-base`, and the official `ip2location-nodejs` package.

## Testing strategy

Vitest tests import the public entrypoint and inject the narrow reader factory, requiring no BIN file. Cover mapping, no-result records, invalid input, IPv6 database limitations, and reader lifecycle failures.

## Documentation obligations

Keep the README aligned with the external database requirement, official reader lifecycle, supported address coverage, and factory injection point.

## Release-readiness standards

The package must build, pass its Vitest suite and Biome lint, and must not include or implement a private BIN parser.