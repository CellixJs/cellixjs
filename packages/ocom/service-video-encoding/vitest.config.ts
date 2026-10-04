import { nodeConfig } from '@cellix/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
	nodeConfig,
	defineConfig({
		resolve: {
			alias: {
				'@cellix/service-video-encoding': '../../cellix/service-video-encoding/src/index.ts',
				'@ocom/service-video-encoding': './src/index.ts',
			},
		},
	}),
);
