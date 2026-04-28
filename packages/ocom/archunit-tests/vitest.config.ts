import { nodeConfig } from '@cellix/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
	nodeConfig,
	defineConfig({
		resolve: {
			alias: {
				// Vite cannot resolve the new `@typescript/native-preview` package's
				// "." export from the `typescript` name. Arch tests import `typescript`.
				// Map `typescript` to the JS-based `@typescript/typescript6` compiler for tests.
				typescript: '@typescript/typescript6',
			},
		},
		test: {
			typecheck: {
				enabled: false,
			},
			globals: true,
			testTimeout: 60000,
		},
	}),
);
