import { ServiceBlobStorage as CellixServiceBlobStorage } from '@cellix/service-blob-storage';
import { Ajv2020 } from 'ajv/dist/2020.js';
import FeatureFlagsLocal from './feature-flags.local.json' with { type: 'json' };
import type { FeatureFlagsPayloadType } from './feature-flags.payload-type.ts';
import FeatureFlagsSchema from './feature-flags.schema.json' with { type: 'json' };

const FEATURE_FLAG_BLOB_NAME = 'feature-flags.json';

const ajv = new Ajv2020({ allErrors: true });
const validateFeatureFlags = ajv.compile(FeatureFlagsSchema);

export class ServiceBlobStorage extends CellixServiceBlobStorage {
	public async getFeatureFlags(): Promise<FeatureFlagsPayloadType> {
		const featureFlagsRaw = (await this.downloadBlobToString('public', FEATURE_FLAG_BLOB_NAME)) ?? JSON.stringify(FeatureFlagsLocal);
		const dataJson: unknown = JSON.parse(featureFlagsRaw);
		if (!validateFeatureFlags(dataJson)) {
			throw new Error(`Feature flag payload validation failed: ${ajv.errorsText(validateFeatureFlags.errors)}`);
		}
		return dataJson as FeatureFlagsPayloadType;
	}

	// in efdo this method was in blob-actions.ts
	private async downloadBlobToString(containerName: string, blobName: string): Promise<string | undefined> {
		try {
			const blobClient = this.getContainerClient(containerName).getBlockBlobClient(blobName);
			return (await blobClient.downloadToBuffer()).toString('utf-8');
		} catch (error) {
			if (isBlobNotFoundError(error)) {
				return undefined;
			}
			throw error;
		}
	}
}

function isBlobNotFoundError(error: unknown): boolean {
	return typeof error === 'object' && error !== null && 'code' in error && error.code === 'BlobNotFound';
}
