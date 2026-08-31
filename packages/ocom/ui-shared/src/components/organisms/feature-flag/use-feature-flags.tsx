import { useContext } from 'react';
import { type FeatureFlagInterface, FeatureFlagsContext } from './feature-flag-context.tsx';

export function useFeatureFlags(): FeatureFlagInterface {
	return useContext(FeatureFlagsContext);
}
