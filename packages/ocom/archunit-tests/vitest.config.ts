import { nodeConfig } from '@cellix/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
	nodeConfig,
	defineConfig({
		test: {
			typecheck: {
				enabled: false,
			},
			globals: true,
			testTimeout: 60000,
		},
	}),
);
