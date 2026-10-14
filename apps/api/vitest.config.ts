import { nodeConfig } from '@cellix/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
	nodeConfig,
	defineConfig({
		resolve: {
			alias: {
				'@ocom/service-geolocation-dbip-hosted': '../../packages/cagematch/service-geolocation-dbip-hosted/src/index.ts',
				'@ocom/service-geolocation-dbip-mmdb': '../../packages/cagematch/service-geolocation-dbip-mmdb/src/index.ts',
				'@ocom/service-geolocation-ipinfo-hosted': '../../packages/cagematch/service-geolocation-ipinfo-hosted/src/index.ts',
				'@ocom/service-geolocation-ipinfo-mmdb': '../../packages/cagematch/service-geolocation-ipinfo-mmdb/src/index.ts',
				'@ocom/service-geolocation-ip2location-bin': '../../packages/cagematch/service-geolocation-ip2location-bin/src/index.ts',
				'@ocom/service-geolocation-ip2location-hosted': '../../packages/cagematch/service-geolocation-ip2location-hosted/src/index.ts',
				'@ocom/service-geolocation-maxmind-hosted': '../../packages/cagematch/service-geolocation-maxmind-hosted/src/index.ts',
				'@ocom/service-geolocation-maxmind-mmdb': '../../packages/cagematch/service-geolocation-maxmind-mmdb/src/index.ts',
			},
		},
		test: {
			coverage: {
				include: ['src/**/*.ts'],
				exclude: ['src/service-config/**', 'src/index.ts'],
			},
		},
	}),
);
