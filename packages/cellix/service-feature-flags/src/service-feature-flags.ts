import type { ServiceBase } from '@cellix/api-services-spec';
import { Ajv2020 } from 'ajv/dist/2020.js';
import FeatureFlagsSchema from './feature-flags.schema.json' with { type: 'json' };
import type { FeatureFlagServiceOptions, FeatureFlags, FeatureFlagsDocument, FeatureFlagTextSource } from './interfaces.ts';

const ajv = new Ajv2020({ allErrors: true });
const validateFeatureFlags = ajv.compile(FeatureFlagsSchema);

function validateOptions(options: FeatureFlagServiceOptions): void {
	if (!options.containerName.trim()) {
		throw new Error("Provide a non-empty 'containerName' for feature-flag retrieval");
	}
	if (!options.blobName.trim()) {
		throw new Error("Provide a non-empty 'blobName' for feature-flag retrieval");
	}
}

/**
 * Framework infrastructure service that reads and validates feature flags.
 *
 * The service depends only on {@link FeatureFlagTextSource}; applications may
 * adapt blob storage, HTTP, or another text store at composition time.
 *
 * @example
 * ```ts
 * const service = new ServiceFeatureFlags(blobStorage, {
 *   containerName: 'public',
 *   blobName: process.env.FEATURE_FLAG_BLOB_NAME!,
 *   fallback: { FeatureFlags: [] },
 * });
 * ```
 *
 * @returns A lifecycle-managed service that resolves validated feature-flag
 * documents through `getFeatureFlags()`.
 */
export class ServiceFeatureFlags implements ServiceBase<FeatureFlags>, FeatureFlags {
	private readonly source: FeatureFlagTextSource;
	private readonly options: FeatureFlagServiceOptions;

	public constructor(source: FeatureFlagTextSource, options: FeatureFlagServiceOptions) {
		validateOptions(options);
		this.source = source;
		this.options = options;
	}

	public async startUp(): Promise<this> {
		await Promise.resolve();
		return this;
	}

	public async shutDown(): Promise<void> {
		await Promise.resolve();
	}

	public async getFeatureFlags(): Promise<FeatureFlagsDocument> {
		const document = await this.source.downloadText(this.options);
		if (document === undefined) {
			return this.validate(this.options.fallback ?? { FeatureFlags: [] });
		}

		return this.validate(JSON.parse(document) as unknown);
	}

	private validate(payload: unknown): FeatureFlagsDocument {
		if (!validateFeatureFlags(payload)) {
			throw new Error(`Feature flag payload validation failed: ${ajv.errorsText(validateFeatureFlags.errors)}`);
		}

		return payload as unknown as FeatureFlagsDocument;
	}
}
