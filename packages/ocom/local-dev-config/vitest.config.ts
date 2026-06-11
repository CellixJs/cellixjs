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
		alias: [
			{ find: '@ocom/local-dev-config/hostnames', replacement: join(dirname, 'src/hostnames/index.ts') },
			{ find: '@ocom/local-dev-config/urls', replacement: join(dirname, 'src/urls/index.ts') },
			{ find: '@ocom/local-dev-config', replacement: join(dirname, 'src/index.ts') },
			{ find: '@cellix/local-dev/files', replacement: join(dirname, '../../cellix/local-dev/src/files/index.ts') },
			{ find: '@cellix/local-dev/process', replacement: join(dirname, '../../cellix/local-dev/src/process/index.ts') },
			{ find: '@cellix/local-dev/runners', replacement: join(dirname, '../../cellix/local-dev/src/runners/index.ts') },
			{ find: '@cellix/local-dev/urls', replacement: join(dirname, '../../cellix/local-dev/src/urls/index.ts') },
			{ find: '@cellix/local-dev/vite', replacement: join(dirname, '../../cellix/local-dev/src/vite/index.ts') },
			{ find: '@cellix/local-dev/workspace', replacement: join(dirname, '../../cellix/local-dev/src/workspace/index.ts') },
			{ find: '@cellix/local-dev/worktree', replacement: join(dirname, '../../cellix/local-dev/src/worktree/index.ts') },
			{ find: '@cellix/local-dev', replacement: join(dirname, '../../cellix/local-dev/src/index.ts') },
		],
	},
});
