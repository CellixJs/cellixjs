import { fileURLToPath } from 'node:url';
import { nodeConfig } from '@cellix/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
	nodeConfig,
	defineConfig({
		resolve: {
			alias: {
				'@cagematch/rate-limiting-redis': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
			},
		},
	}),
);
