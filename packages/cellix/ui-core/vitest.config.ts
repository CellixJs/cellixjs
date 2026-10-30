import { join } from 'node:path';
import { createStorybookVitestConfig, getDirnameFromImportMetaUrl } from '@cellix/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

const dirname = getDirnameFromImportMetaUrl(import.meta.url);

export default defineConfig(
	mergeConfig(
		createStorybookVitestConfig(dirname, {
			additionalCoverageExclude: ['src/index.ts', 'src/components/index.ts', 'src/components/molecules/index.ts', 'src/video-player/index.ts', 'src/**/*.d.ts'],
		}),
		{
			resolve: {
				alias: {
					// More specific first: '@cellix/ui-core' would otherwise also match the subpath.
					'@cellix/ui-core/video-player': join(dirname, 'src/video-player/index.ts'),
					'@cellix/ui-core': join(dirname, 'src/index.ts'),
				},
			},
		},
	),
);
