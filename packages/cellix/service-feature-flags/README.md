# `@cellix/service-feature-flags`

Framework feature-flag retrieval service for Cellix applications.

`ServiceFeatureFlags` validates the shared feature-flag document format while
leaving storage and application configuration to the consuming application. It
works with a minimal `FeatureFlagTextSource`, so the source may be Azure Blob
Storage or another text-document provider.

## Usage

```ts
import { ServiceFeatureFlags, type FeatureFlagTextSource } from '@cellix/service-feature-flags';

const source: FeatureFlagTextSource = {
	downloadText: (address) => blobStorage.downloadText(address),
};

const featureFlags = new ServiceFeatureFlags(source, {
	containerName: 'public',
	blobName: process.env.FEATURE_FLAG_BLOB_NAME!,
	fallback: { FeatureFlags: [] },
});

await featureFlags.startUp();
const document = await featureFlags.getFeatureFlags();
```

## Public exports

- `ServiceFeatureFlags`
- `type FeatureFlagTextSource`
- `type FeatureFlagDocumentAddress`
- `type FeatureFlagServiceOptions`
- `type FeatureFlag`
- `type FeatureFlagsDocument`
- `type FeatureFlags`
- `type FeatureFlagsService`

## Notes

- Resolve environment variables in application bootstrap and pass their values
  through `FeatureFlagServiceOptions`.
- `containerName` and `blobName` must be non-empty; the service rejects an
	invalid address during construction.
- A missing source document uses the configured `fallback`; without one, the
  service returns an empty feature-flag document.
- Invalid JSON is rejected by `JSON.parse`; documents that do not match the
  feature-flag contract are rejected with a validation error.