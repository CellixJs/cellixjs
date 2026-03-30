/**
 * Rolldown bundler configuration for @apps/api.
 *
 * Bundles the TypeScript-compiled output (dist/index.js) — including all
 * workspace and npm package dependencies — into a single optimised ESM file at
 * deploy/dist/index.js used for local development and CI/CD deployment.
 *
 * The shared Cellix rolldown config builds a CJS alias map to work around a
 * rolldown beta panic triggered by ESM star imports in graphql ecosystem
 * packages when workspace packages are in the module graph.
 */

import { defineConfig } from 'rolldown';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCellixAzureFunctionsRolldownConfig } from '@cellix/config-rolldown';

const apiDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(apiDir, '../..');

export default defineConfig(async () =>
	createCellixAzureFunctionsRolldownConfig({
		repoRoot,
		appPackageName: '@apps/api',
		applicationNamespaces: ['@ocom/'],
	}),
);
