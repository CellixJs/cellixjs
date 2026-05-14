# `@ocom/service-blob-storage`

OwnerCommunity blob storage adapter over `@cellix/service-blob-storage`.

## Purpose

This package defines the application-facing blob storage contract that is exposed through `ApiContext`, and it provides the app-registered `ServiceBlobStorage` adapter over `@cellix/service-blob-storage`.

## Contract

- `createUploadUrl(...)`
- `createReadUrl(...)`

The full framework blob service is intentionally not exposed to application code. Downscoping here establishes the pattern for future infrastructure services that need a narrower application contract.
