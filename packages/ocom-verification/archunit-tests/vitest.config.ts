import { archConfig } from '@cellix/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
	archConfig,
	defineConfig({
		test: {
			include: ['src/**/*.test.ts'],
		},
	}),
);
