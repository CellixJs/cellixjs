import type { FeatureFlagConfig } from '@ocom/ui-shared';
import featureFlagDefaultValues from './feature-flag-default-values.json' with { type: 'json' };

export const featureFlagConfig: FeatureFlagConfig = {
	cache: 30_000,
	// biome-ignore lint/complexity/useLiteralKeys: strict Vite environment types require indexed access for undeclared keys
	url: import.meta.env['VITE_COMMON_FEATURE_FLAG_URL'] ?? '',
	fallbackFlagValues: featureFlagDefaultValues,
};
