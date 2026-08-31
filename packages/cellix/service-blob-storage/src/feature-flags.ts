import { Ajv2020 } from 'ajv/dist/2020.js';
import FeatureFlagsSchema from './feature-flags.schema.json' with { type: 'json' };
import type { ServiceBlobStorage } from './service-blob-storage.ts';

// const DEFAULT_FEATURE_FLAGS_BLOB_NAME = 'feature-flags.json';

const ajv = new Ajv2020({ allErrors: true });
const validateFeatureFlags = ajv.compile<FeatureFlagsPayload>(FeatureFlagsSchema);

/** A named, string-valued application feature flag. */
export interface FeatureFlag {
	readonly Name: string;
	readonly Description?: string;
	readonly Value: string;
	readonly AllowedValues?: readonly string[];
	readonly RetirementDate?: string;
}

/** The versioned JSON document format used to store feature flags. */
export interface FeatureFlagsPayload {
	readonly FeatureFlags: readonly FeatureFlag[];
}

/** Options that identify and provide a fallback for a Blob-backed feature-flag document. */
export interface FeatureFlagOptions {
	readonly containerName: string;
	readonly blobName: string;
	readonly fallback: FeatureFlagsPayload;
}

export async function readFeatureFlags(blobStorage: Pick<ServiceBlobStorage, 'downloadText'>, options: FeatureFlagOptions): Promise<FeatureFlagsPayload> {
	const dataRaw = await blobStorage.downloadText({ containerName: options.containerName, blobName: options.blobName });
	if (dataRaw === undefined) {
		return options.fallback;
	}

	const dataJson: unknown = JSON.parse(dataRaw);
	if (!validateFeatureFlags(dataJson)) {
		throw new Error(`Feature flag payload validation failed: ${ajv.errorsText(validateFeatureFlags.errors)}`);
	}
	return dataJson;
}
