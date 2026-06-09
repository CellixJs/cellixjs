import { join } from 'node:path';
import { getDirnameFromImportMetaUrl, nodeConfig } from '@cellix/config-vitest';
import { mergeConfig } from 'vitest/config';

const dirname = getDirnameFromImportMetaUrl(import.meta.url);

export default mergeConfig(nodeConfig, {
	test: {
		typecheck: {
			tsconfig: './tsconfig.vitest.json',
		},
	},
	resolve: {
		alias: {
			'@ocom/local-dev-config': join(dirname, 'src/index.ts'),
			'@cellix/local-dev': join(dirname, '../../cellix/local-dev/src/index.ts'),
		},
	},
});
