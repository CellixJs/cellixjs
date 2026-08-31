import { createContext } from 'react';

export interface FeatureFlags {
	FeatureFlags: {
		Name: string;
		Value: string;
	}[];
}

export interface FeatureFlagInterface {
	FeatureFlagList: FeatureFlags | undefined;
	GetFeatureFlagByName: (name: string) => string;
}

const stub = (): never => {
	throw new Error('You forgot to wrap your component in <FeatureFlagProvider>.');
};

const initialContext = {
	FeatureFlagList: undefined,
	GetFeatureFlagByName: stub,
};

export const FeatureFlagsContext = createContext<FeatureFlagInterface>(initialContext);
