import { baseConfig } from '@cellix/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
	baseConfig,
	defineConfig({
		test: {
			environment: 'jsdom',
			passWithNoTests: true,
		},
	}),
);
