import { createStorybookVitestConfig, getDirnameFromImportMetaUrl } from '@cellix/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

const dirname = getDirnameFromImportMetaUrl(import.meta.url);

export default mergeConfig(
	defineConfig(
		createStorybookVitestConfig(dirname, {
			additionalCoverageExclude: ['src/components/index.ts'],
		}),
	),
	defineConfig({
		test: {
			coverage: {
				include: ['src/components/**/*.{ts,tsx}'],
			},
		},
	}),
);
