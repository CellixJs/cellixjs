/**
 * Rolldown bundler configuration for @apps/video-worker.
 *
 * Bundles the compiled worker (dist/index.js) and all of its workspace and npm
 * dependencies into a single ESM file at deploy/dist/index.mjs, which is the
 * only application file copied into the container image. The `.mjs` extension
 * lets Node load it as ESM without a package.json in the image.
 */
/// <reference types="node" />
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCellixAzureFunctionsRolldownConfig } from '@cellix/config-rolldown';
import { defineConfig } from 'rolldown';

const workerDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(workerDir, '../..');

export default defineConfig(async () => {
	const config = await createCellixAzureFunctionsRolldownConfig({
		repoRoot,
		appPackageName: '@apps/video-worker',
		applicationNamespaces: ['@ocom/'],
	});
	return {
		...config,
		output: { ...config.output, entryFileNames: '[name].mjs', chunkFileNames: '[name]-[hash].mjs' },
	};
});
