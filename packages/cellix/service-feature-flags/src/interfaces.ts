/**
 * Identifies a feature-flag document within an application-owned text source.
 *
 * The Cellix feature-flag service does not dictate how documents are stored.
 * Blob-backed applications use the container and blob names, while alternate
 * source adapters can interpret the same fields for their own storage model.
 */
export interface FeatureFlagDocumentAddress {
	containerName: string;
	blobName: string;
}

/**
 * Minimal capability required by the feature-flag infrastructure service.
 *
 * Application bootstrap adapts its configured storage service to this port.
 * Returning `undefined` indicates that no document exists at the requested
 * address and allows the feature-flag service to use its optional fallback.
 *
 * @example
 * ```ts
 * const source: FeatureFlagTextSource = {
 *   downloadText: (address) => blobStorage.downloadText(address),
 * };
 * ```
 */
export interface FeatureFlagTextSource {
	downloadText(address: FeatureFlagDocumentAddress): Promise<string | undefined>;
}

/** A named, string-valued application feature flag. */
export interface FeatureFlag {
	readonly Name: string;
	readonly Description?: string;
	readonly Value: string;
	readonly AllowedValues?: readonly string[];
	readonly RetirementDate?: string;
}

/** The versioned JSON document format used to store feature flags. */
export interface FeatureFlagsDocument {
	readonly FeatureFlags: readonly FeatureFlag[];
}

/**
 * Configuration for a {@link ServiceFeatureFlags} instance.
 *
 * Applications resolve environment variables and choose storage names during
 * bootstrap, then pass concrete values here. Cellix intentionally owns no
 * environment-variable names or application fallback values.
 */
export interface FeatureFlagServiceOptions extends FeatureFlagDocumentAddress {
	fallback?: FeatureFlagsDocument;
}

/** Framework-level feature-flag retrieval operations. */
export interface FeatureFlags {
	/** Retrieves and validates the configured feature-flag document. */
	getFeatureFlags(): Promise<FeatureFlagsDocument>;
}

/**
 * Infrastructure service that reads feature flags from an injected text source.
 *
 * The implementation is intentionally independent of Azure Blob Storage so an
 * application can substitute another source without changing feature-flag
 * semantics.
 */
export interface FeatureFlagsService extends FeatureFlags {
	startUp(): Promise<this>;
	shutDown(): Promise<void>;
}

import type { ServiceFeatureFlags } from './service-feature-flags.ts';
