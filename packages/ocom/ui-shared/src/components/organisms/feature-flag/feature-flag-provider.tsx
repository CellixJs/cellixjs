import retry from 'async-retry';
import { LRUCache } from 'lru-cache';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
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

export function FeatureFlagProvider({ config, children }: FeatureFlagProviderProps) {
	const initialFeatureFlagList = isInStorybookEnv() ? config.fallbackFlagValues : undefined;
	const [featureFlagList, setFeatureFlagList] = useState<FeatureFlags | undefined>(initialFeatureFlagList);
	const cacheMilliseconds = config.cache || DEFAULT_CACHE_MILLISECONDS;
	const previousFeatureFlagList = useRef<FeatureFlags | undefined>(initialFeatureFlagList);

	const setFeatureFlags = useCallback((featureFlags: FeatureFlags | undefined) => {
		if (JSON.stringify(previousFeatureFlagList.current) === JSON.stringify(featureFlags)) {
			return;
		}

		previousFeatureFlagList.current = featureFlags;
		setFeatureFlagList(featureFlags);
	}, []);

	useEffect(() => {
		const setIntervalImmediately = (func: () => Promise<void>, interval: number) => {
			void func();
			return globalThis.setInterval(() => void func(), interval);
		};

		const cache = new LRUCache<string, FeatureFlags>({
			max: 500,
			maxSize: 5000,
			ttlAutopurge: false,
			ttl: cacheMilliseconds,
			ignoreFetchAbort: true,
			allowStaleOnFetchAbort: true,
			sizeCalculation: () => 1,
			fetchMethod: async (): Promise<FeatureFlags> => fetchFeatureFlags(config.url),
		});

		const getFeatureFlags = async () => {
			if (!config.url) {
				setFeatureFlags(config.fallbackFlagValues);
				return;
			}

			try {
				const featureFlags = await cache.fetch('featureFlagsKey');
				if (featureFlags instanceof Object) {
					setFeatureFlags(featureFlags);
				}
			} catch {
				setFeatureFlags(config.fallbackFlagValues);
			}
		};

		if (isInStorybookEnv()) {
			setFeatureFlags(config.fallbackFlagValues);
			return;
		}

		const refreshInterval = setIntervalImmediately(getFeatureFlags, cacheMilliseconds / 2);

		return () => {
			globalThis.clearInterval(refreshInterval);
		};
	}, [cacheMilliseconds, config, setFeatureFlags]);

	const getFeatureFlagByName = (name: string): string => featureFlagList?.FeatureFlags.find((featureFlag) => featureFlag.Name === name)?.Value ?? '';

	return <FeatureFlagsContext.Provider value={{ FeatureFlagList: featureFlagList, GetFeatureFlagByName: getFeatureFlagByName }}>{children}</FeatureFlagsContext.Provider>;
}

function fetchFeatureFlags(url: string): Promise<FeatureFlags> {
	const timestamp = Date.now();

	return retry(
		async () => {
			const response = await fetch(`${url}?${timestamp}`, { cache: 'no-store' });
			if (!response.ok) {
				throw new Error(`Feature flag request failed with status ${response.status}`);
			}
			return (await response.json()) as FeatureFlags;
		},
		{ retries: 3 },
	);
}
