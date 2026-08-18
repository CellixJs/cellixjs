import { Ajv2020 } from 'ajv/dist/2020.js';
import FeatureFlagsSchema from './feature-flags.schema.json' with { type: 'json' };
import type { BlobStorage } from './interfaces.ts';

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
export interface FeatureFlagStoreOptions {
	readonly containerName: string;
	readonly blobName: string;
	readonly fallback: FeatureFlagsPayload;
}

/** A Blob-storage instance enriched with feature-flag access. */
export type FeatureFlagEnabledBlobStorage<TBlobStorage> = TBlobStorage & {
	getFeatureFlags(): Promise<FeatureFlagsPayload>;
};

// biome-ignore lint/suspicious/noExplicitAny: TypeScript requires any[] for mixin base constructors.
type BlobStorageServiceConstructor = new (...args: any[]) => Pick<BlobStorage, 'downloadText'>;

/**
 * Creates a Blob-backed feature-flag store.
 *
 * The store validates remote JSON before returning it and uses the supplied
 * fallback only when the blob is absent. Transport failures and invalid JSON
 * remain visible to callers so configuration problems are not silently hidden.
 *
 * @param blobStorage - Blob capability used to access the configured document.
 * @param options - Blob location and fallback flag values.
 * @returns A lightweight feature-flag store with no independent lifecycle to register.
 *
 * @example
 * ```ts
 * const featureFlags = createFeatureFlagStore(blobStorage, {
 *   containerName: 'public',
 *   fallback: { FeatureFlags: [] },
 * });
 *
 * const { FeatureFlags } = await featureFlags.getFeatureFlags();
 * ```
 */
export function createFeatureFlagStore(blobStorage: Pick<BlobStorage, 'downloadText'>, options: FeatureFlagStoreOptions): FeatureFlagStore {
	const { blobName } = options;

	return {
		async getFeatureFlags(): Promise<FeatureFlagsPayload> {
			const dataRaw = await blobStorage.downloadText({ containerName: options.containerName, blobName });
			if (dataRaw === undefined) {
				return options.fallback;
			}

			const dataJson: unknown = JSON.parse(dataRaw);
			const validatedFeatureFlags = validateFeatureFlags(dataJson);
			if (!validatedFeatureFlags) {
				throw new Error(`Feature flag payload validation failed: ${ajv.errorsText(validateFeatureFlags.errors)}`);
			}
			return dataJson;
		},
	};
}

/**
 * Attaches Blob-backed feature-flag access to a Blob-storage instance.
 *
 * The original instance is returned so it retains its own lifecycle and Blob
 * operations while exposing the optional `getFeatureFlags()` capability.
 *
 * @param blobStorage - Blob-storage instance that reads the feature-flag document.
 * @param options - Blob location and fallback flag values.
 * @returns The original Blob-storage instance enriched with feature-flag access.
 *
 * @example
 * ```ts
 * const configuredBlobStorage = enableFeatureFlags(blobStorage, {
 *   containerName: 'public',
 *   fallback: { FeatureFlags: [] },
 * });
 *
 * const { FeatureFlags } = await configuredBlobStorage.getFeatureFlags();
 * ```
 */
export function enableFeatureFlags<TBlobStorage extends Pick<BlobStorage, 'downloadText'>>(blobStorage: TBlobStorage, options: FeatureFlagStoreOptions): FeatureFlagEnabledBlobStorage<TBlobStorage> {
	if (!options.blobName || !options.containerName || !options.fallback) {
		throw new Error('All feature flag options required');
	}
	const featureFlagStore = createFeatureFlagStore(blobStorage, options);

	return Object.assign(blobStorage, {
		getFeatureFlags: () => featureFlagStore.getFeatureFlags(),
	});
}

/**
 * Creates a Blob-storage service class with opt-in feature-flag support.
 *
 * Application adapters can use this factory to expose the feature-flag
 * capability without duplicating its method implementation across service
 * wrappers.
 *
 * @param BaseService - Blob-storage service class that provides `downloadText()`.
 * @returns A subclass that adds `enableFeatureFlags()` while preserving the base constructor contract.
 *
 * @example
 * ```ts
 * const FeatureFlagEnabledBlobStorage = createFeatureFlagEnabledBlobStorageService(ServiceBlobStorage);
 * const blobStorage = new FeatureFlagEnabledBlobStorage({ accountName: 'mystorageaccount' });
 * const configuredStorage = blobStorage.enableFeatureFlags({
 *   containerName: 'public',
 *   fallback: { FeatureFlags: [] },
 * });
 * ```
 */
export function createFeatureFlagEnabledBlobStorageService<TBase extends BlobStorageServiceConstructor>(BaseService: TBase) {
	class FeatureFlagEnabledBlobStorageService extends BaseService {
		public enableFeatureFlags(options: FeatureFlagStoreOptions): FeatureFlagEnabledBlobStorage<this> {
			return enableFeatureFlags(this, options);
		}
	}

	return FeatureFlagEnabledBlobStorageService;
}

/** A narrow, Blob-backed feature-flag capability for application services. */
export interface FeatureFlagStore {
	getFeatureFlags(): Promise<FeatureFlagsPayload>;
}
