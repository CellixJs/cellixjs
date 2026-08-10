import { ServiceBlobStorage as CellixServiceBlobStorage } from '@cellix/service-blob-storage';
import { Ajv2020 } from 'ajv/dist/2020.js';
import { FeatureFlagsLocal } from './feature-flags.local.ts';
import { FEATURE_FLAG_BLOB_NAME, type FeatureFlagsPayloadType, FeatureFlagsSchema } from './feature-flags.ts';

const ajv = new Ajv2020({ allErrors: true });

export class ServiceBlobStorage extends CellixServiceBlobStorage {
	private getValidatedBlobDataObject<T>(schema: object, dataRaw: string): T {
		const dataJson: unknown = JSON.parse(dataRaw);
		const validate = ajv.compile(schema);
		if (!validate(dataJson)) {
			throw new Error(`Feature flag payload validation failed: ${ajv.errorsText(validate.errors)}`);
		}
		return dataJson as T;
	}

	public async getFeatureFlags(): Promise<FeatureFlagsPayloadType> {
		const featureFlagsRaw = (await this.downloadBlobToString('public', FEATURE_FLAG_BLOB_NAME)) ?? FeatureFlagsLocal;
		return this.getValidatedBlobDataObject<FeatureFlagsPayloadType>(FeatureFlagsSchema, featureFlagsRaw);
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
