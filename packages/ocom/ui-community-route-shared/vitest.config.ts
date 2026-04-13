import { createStorybookVitestConfig, getDirnameFromImportMetaUrl } from '@cellix/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

const dirname = getDirnameFromImportMetaUrl(import.meta.url);

export default mergeConfig(
	defineConfig(
		createStorybookVitestConfig(dirname, {
			additionalCoverageExclude: ['components/index.ts'],
		}),
	),
	defineConfig({
		test: {
			coverage: {
				include: ['components/**/*.{ts,tsx}'],
			},
		},
	}),
);
