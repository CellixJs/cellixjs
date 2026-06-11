import { nodeConfig } from '@cellix/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
	nodeConfig,
	defineConfig({
		resolve: {
			alias: {
				'@cellix/service-queue-storage': '../../cellix/service-queue-storage/src/index.ts',
				'@ocom/service-queue-storage': './src/index.ts',
			},
		},
	}),
);
