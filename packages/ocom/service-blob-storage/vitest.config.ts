import { nodeConfig } from '@cellix/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
	nodeConfig,
	defineConfig({
		resolve: {
			alias: {
				'@cellix/service-blob-storage': '../../cellix/service-blob-storage/src/index.ts',
				'@ocom/service-blob-storage': './src/index.ts',
			},
		},
	}),
);
