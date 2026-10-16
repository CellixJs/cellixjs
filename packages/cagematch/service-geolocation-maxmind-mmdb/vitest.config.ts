import { nodeConfig } from '@cellix/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
	nodeConfig,
	defineConfig({
		resolve: {
			alias: {
				'@ocom/service-geolocation-maxmind-mmdb': './src/index.ts',
				'@cellix/service-geolocation-base': '../../cellix/service-geolocation-base/src/index.ts',
			},
		},
	}),
);
