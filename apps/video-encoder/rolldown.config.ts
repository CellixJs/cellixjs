/**
 * Rolldown bundler configuration for @apps/video-encoder.
 *
 * Bundles the compiled CLI (dist/index.js) and all of its workspace and npm
 * dependencies into a single ESM file at deploy/dist/index.mjs, so staff can
 * run it with `node` without installing the monorepo. The `.mjs` extension
 * lets Node load it as ESM without a package.json next to it.
 */
/// <reference types="node" />
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCellixAzureFunctionsRolldownConfig } from '@cellix/config-rolldown';
import { defineConfig } from 'rolldown';

const appDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(appDir, '../..');

export default defineConfig(async () => {
	const config = await createCellixAzureFunctionsRolldownConfig({
		repoRoot,
		appPackageName: '@apps/video-encoder',
		applicationNamespaces: ['@ocom/'],
	});
	return {
		...config,
		output: { ...config.output, entryFileNames: '[name].mjs', chunkFileNames: '[name]-[hash].mjs' },
	};
});
