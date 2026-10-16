import { defineConfig, mergeConfig } from 'vitest/config';
import { nodeConfig } from '../../cellix/config-vitest/dist/configs/node.config.js';

export default mergeConfig(
	nodeConfig,
	defineConfig({
		resolve: {
			alias: {
				'@ocom/service-geolocation-ip2location-bin': './src/index.ts',
				'@cellix/service-geolocation-base': '../../cellix/service-geolocation-base/src/index.ts',
			},
		},
	}),
);
