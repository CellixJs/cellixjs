import { nodeConfig } from '@cellix/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
	nodeConfig,
	defineConfig({
		resolve: {
			alias: {
				'@ocom/service-geolocation-dbip-hosted': '../../cagematch/service-geolocation-dbip-hosted/src/index.ts',
				'@ocom/service-geolocation-dbip-mmdb': '../../cagematch/service-geolocation-dbip-mmdb/src/index.ts',
				'@ocom/service-geolocation-ipinfo-hosted': '../../cagematch/service-geolocation-ipinfo-hosted/src/index.ts',
				'@ocom/service-geolocation-ipinfo-mmdb': '../../cagematch/service-geolocation-ipinfo-mmdb/src/index.ts',
				'@ocom/service-geolocation-ip2location-bin': '../../cagematch/service-geolocation-ip2location-bin/src/index.ts',
				'@ocom/service-geolocation-ip2location-hosted': '../../cagematch/service-geolocation-ip2location-hosted/src/index.ts',
				'@ocom/service-geolocation-maxmind-hosted': '../../cagematch/service-geolocation-maxmind-hosted/src/index.ts',
				'@ocom/service-geolocation-maxmind-mmdb': '../../cagematch/service-geolocation-maxmind-mmdb/src/index.ts',
			},
		},
	}),
);
