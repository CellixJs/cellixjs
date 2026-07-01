import path from 'node:path';
import { type AzureFunctionsLocalSettingsOptions, isE2E } from '@cellix/local-dev';
import { readJsonFile } from '@cellix/local-dev/files';
import { resolveWorkspaceRoot } from '@cellix/local-dev/workspace';
import type { OcomLocalDevOptions } from '../types.ts';

interface ApiSettingsDocument {
	Values?: Record<string, unknown>;
	Host?: Record<string, unknown>;
}

/**
 * The exact api settings that get scoped to a worktree, named explicitly so it
 * is obvious what changes. Everything else in the settings file is passed
 * through untouched. The sync applies these only when a worktree is active.
 */
const API_WORKTREE_CONVERSION = {
	// OIDC URLs: hostname gains the worktree suffix.
	urlKeys: ['ACCOUNT_PORTAL_OIDC_ISSUER', 'ACCOUNT_PORTAL_OIDC_ENDPOINT', 'STAFF_PORTAL_OIDC_ISSUER', 'STAFF_PORTAL_OIDC_ENDPOINT'],
	// Mongo connection string: port shifts to the worktree Mongo port.
	mongoKeys: ['COSMOSDB_CONNECTION_STRING'],
	// Azure storage: replaced with a worktree-scoped Azurite connection string.
	azuriteKeys: ['AZURE_STORAGE_CONNECTION_STRING', 'AzureWebJobsStorage'],
} as const;

/**
 * The single entry point for the OCOM api's Azure Functions local settings.
 *
 * The values themselves live in `apps/api/local.settings.json` (normal dev) and
 * `apps/api/local-settings.e2e.json` (E2E); this reads the mode-appropriate file
 * and declares — via {@link API_WORKTREE_CONVERSION} — exactly which keys the
 * sync should scope to the active worktree.
 *
 * @param options - Optional environment (selects normal vs E2E) and
 * workspace-root overrides.
 * @returns Local-settings options for the api's dev runner and standalone sync.
 */
export function buildOcomApiLocalSettings(options: OcomLocalDevOptions = {}): AzureFunctionsLocalSettingsOptions {
	const env = options.env ?? process.env;
	const workspaceRoot = options.workspaceRoot ?? resolveWorkspaceRoot();
	const fileName = isE2E(env) ? 'local-settings.e2e.json' : 'local.settings.json';
	const document = readJsonFile<ApiSettingsDocument>(path.join(workspaceRoot, 'apps', 'api', fileName));

	return {
		...(document.Values ? { values: document.Values } : {}),
		...(document.Host ? { host: document.Host } : {}),
		worktreeConversion: {
			urlKeys: [...API_WORKTREE_CONVERSION.urlKeys],
			mongoKeys: [...API_WORKTREE_CONVERSION.mongoKeys],
			azuriteKeys: [...API_WORKTREE_CONVERSION.azuriteKeys],
		},
	};
}
