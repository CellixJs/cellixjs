/**
 * Rolldown bundler configuration for @ocom/api.
 *
 * Bundles the TypeScript-compiled output (dist/src/index.js) — including all
 * workspace and npm package dependencies — into a single optimised ESM file at
 * deploy/dist/index.js used for local development and CI/CD deployment.
 *
 * The async defineConfig form builds a CJS alias map (see scripts/cjs-alias-map.mjs)
 * to work around a rolldown beta panic triggered by ESM star imports in graphql
 * ecosystem packages when workspace packages are in the module graph.
 */

import { defineConfig } from 'rolldown';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCjsAliasMap } from './build-pipelines/scripts/cjs-alias-map.mjs';

const apiDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(apiDir, '../..');

const banner = `import { createRequire as __createRequire } from 'node:module';
globalThis.require = __createRequire(import.meta.url);`;

export default defineConfig(async () => ({
	input: './dist/index.js',
	platform: 'node',
	treeshake: true,
	external: [
		/^node:/,
		// @azure/functions-core is injected by the Azure Functions worker process at
		// runtime (not an installable npm package). Marking it external leaves the
		// require() call as-is so the host can intercept it on startup.
		'@azure/functions-core',
	],
	resolve: { alias: await buildCjsAliasMap(repoRoot) },
	transform: { define: { __dirname: 'import.meta.dirname' } },
	output: { dir: 'deploy/dist', format: 'esm', sourcemap: true, banner },
	onLog(level, log, defaultHandler) {
		if (
			level === 'warn' &&
			log.code === 'EVAL' &&
			typeof log.message === 'string' &&
			log.message.includes('@protobufjs/inquire/index.js')
		) {
			return;
		}
		defaultHandler(level, log);
	},
}));

