import FeatureFlagsLocal from './feature-flags.local.json' with { type: 'json' };

// biome-ignore lint/complexity/useLiteralKeys: strict environment types require indexed access for undeclared variables
const blobName = process.env['FEATURE_FLAG_BLOB_NAME'] ?? '';
const containerName = 'public';

export { blobName, containerName, FeatureFlagsLocal as fallback };
