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

/*
 * Avoid VScode reporting "Cannot find name 'NodeJS'" errors in this file, which uses NodeJS types but is not compiled by TypeScript and thus does not have access to the types specified in tsconfig.json.
 * rolldown.config.ts is NOT expected to be included in the TypeScript compilation, as it is used by the rolldown bundler at build time and is not part of the runtime code.
 * The types specified in tsconfig.json are only applied to files that are included in the compilation, and since rolldown.config.ts is not included, it does not have access to those types.
 * By adding this reference directive, we can ensure that the NodeJS types are available for use in this file without causing phantom errors in the rest of the project.
 */
/// <reference types="node" />

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCellixAzureFunctionsRolldownConfig } from '@cellix/config-rolldown';
import { defineConfig } from 'rolldown';

const apiDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(apiDir, '../..');

export default defineConfig(async () =>
	createCellixAzureFunctionsRolldownConfig({
		repoRoot,
		appPackageName: '@apps/api',
		applicationNamespaces: ['@ocom/'],
	}),
);
