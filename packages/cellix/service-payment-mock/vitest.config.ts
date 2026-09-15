import { nodeConfig } from '@cellix/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
	nodeConfig,
	defineConfig({
		resolve: {
			alias: {
				'@cellix/service-payment-mock': './src/index.ts',
			},
		},
	}),
);
