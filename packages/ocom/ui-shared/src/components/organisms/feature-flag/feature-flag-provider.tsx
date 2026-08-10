import { LRUCache } from 'lru-cache';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { type FeatureFlags, FeatureFlagsContext } from './feature-flag-context.tsx';
import { isInStorybookEnv } from './is-in-storybook-env.ts';

export interface FeatureFlagConfig {
	readonly cache?: number;
	readonly url: string;
	readonly fallbackFlagValues: FeatureFlags;
}

export interface FeatureFlagProviderProps {
	readonly config: FeatureFlagConfig;
	readonly children: ReactNode;
}

const DEFAULT_CACHE_MILLISECONDS = 30_000;
const RETRY_ATTEMPTS = 3;

export function FeatureFlagProvider({ config, children }: FeatureFlagProviderProps) {
	const initialFeatureFlagList = isInStorybookEnv() ? config.fallbackFlagValues : undefined;
	const [featureFlagList, setFeatureFlagList] = useState<FeatureFlags | undefined>(initialFeatureFlagList);
	const cacheMilliseconds = config.cache ?? DEFAULT_CACHE_MILLISECONDS;
	const previousFeatureFlagList = useRef<FeatureFlags | undefined>(initialFeatureFlagList);

	useEffect(() => {
		const cache = new LRUCache<string, FeatureFlags>({ max: 1, ttl: cacheMilliseconds });
		let isDisposed = false;

		const setFeatureFlags = (featureFlags: FeatureFlags) => {
			if (JSON.stringify(previousFeatureFlagList.current) === JSON.stringify(featureFlags)) {
				return;
			}

			previousFeatureFlagList.current = featureFlags;
			setFeatureFlagList(featureFlags);
		};

		const refreshFeatureFlags = async () => {
			if (!config.url) {
				setFeatureFlags(config.fallbackFlagValues);
				return;
			}

			try {
				const cachedFeatureFlags = cache.get('featureFlags');
				if (cachedFeatureFlags) {
					setFeatureFlags(cachedFeatureFlags);
					return;
				}

				const featureFlags = await fetchFeatureFlags(config.url);
				cache.set('featureFlags', featureFlags);
				if (!isDisposed) {
					setFeatureFlags(featureFlags);
				}
			} catch {
				if (!isDisposed) {
					setFeatureFlags(config.fallbackFlagValues);
				}
			}
		};

		if (isInStorybookEnv()) {
			setFeatureFlags(config.fallbackFlagValues);
			return;
		}

		void refreshFeatureFlags();
		const refreshInterval = globalThis.setInterval(() => void refreshFeatureFlags(), cacheMilliseconds / 2);

		return () => {
			isDisposed = true;
			globalThis.clearInterval(refreshInterval);
		};
	}, [cacheMilliseconds, config]);

	const getFeatureFlagByName = (name: string): string => featureFlagList?.FeatureFlags.find((featureFlag) => featureFlag.Name === name)?.Value ?? '';

	return <FeatureFlagsContext.Provider value={{ FeatureFlagList: featureFlagList, GetFeatureFlagByName: getFeatureFlagByName }}>{children}</FeatureFlagsContext.Provider>;
}

async function fetchFeatureFlags(url: string): Promise<FeatureFlags> {
	let lastError: unknown;

	for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt += 1) {
		try {
			const response = await fetch(`${url}?${Date.now()}`, { cache: 'no-store' });
			if (!response.ok) {
				throw new Error(`Feature flag request failed with status ${response.status}`);
			}
			return (await response.json()) as FeatureFlags;
		} catch (error) {
			lastError = error;
		}
	}

	throw lastError;
}
