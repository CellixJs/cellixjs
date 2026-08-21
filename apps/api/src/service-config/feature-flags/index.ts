import type { FeatureFlagOptions } from '@ocom/service-blob-storage';
import FeatureFlagsLocal from './feature-flags.local.json' with { type: 'json' };

const FEATURE_FLAG_BLOB_NAME = process.env['FEATURE_FLAG_BLOB_NAME'] ?? '';

const options: FeatureFlagOptions = {
	containerName: 'public',
	blobName: FEATURE_FLAG_BLOB_NAME,
	fallback: FeatureFlagsLocal,
};

export { options };
