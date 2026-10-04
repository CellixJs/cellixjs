import { join } from 'node:path';
import { createStorybookVitestConfig, getDirnameFromImportMetaUrl } from '@cellix/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

const dirname = getDirnameFromImportMetaUrl(import.meta.url);

export default defineConfig(
	mergeConfig(
		createStorybookVitestConfig(dirname, {
			additionalCoverageExclude: ['src/index.ts', 'src/components/index.ts', 'src/**/*.d.ts'],
		}),
		{
			resolve: {
				alias: {
					'@cellix/ui-video-player': join(dirname, 'src/index.ts'),
				},
			},
		},
	),
);
