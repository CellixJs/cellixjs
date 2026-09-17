import { useContext } from 'react';
import { type FeatureFlagInterface, FeatureFlagsContext } from './feature-flag-context.tsx';

/**
 * Reads the nearest feature-flag provider without fetching or changing flags.
 * @returns The current flag document and string lookup function. Missing and
 * unresolved values return an empty string rather than throwing.
 * @example
 * ```tsx
 * const { GetFeatureFlagByName } = useFeatureFlags();
 * const enabled = GetFeatureFlagByName('MY_FEATURE') === 'true';
 * ```
 */
export function useFeatureFlags(): FeatureFlagInterface {
	return useContext(FeatureFlagsContext);
}
