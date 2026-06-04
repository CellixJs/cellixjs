import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildPortlessUrl, resolvePortlessHostnames } from './hostnames.ts';
import { getAzuriteConnectionString } from './worktree-ports.ts';

interface ApiLocalSettingsDocument {
	Values?: Record<string, string>;
}

interface SyncApiLocalSettingsOptions {
	appDir?: string;
	workspaceRoot?: string;
	env?: NodeJS.ProcessEnv;
	mode?: 'e2e';
}

/**
 * Applies the shared Cellix e2e and worktree overrides to an API
 * `local.settings.json` document.
 */
export function applyApiLocalSettingsOverrides(settings: ApiLocalSettingsDocument, options: Pick<SyncApiLocalSettingsOptions, 'workspaceRoot' | 'env'> = {}): ApiLocalSettingsDocument {
	const env = options.env ?? process.env;
	const values = { ...(settings.Values ?? {}) };

	if (env['WORKTREE_NAME']) {
		const hostnames = resolvePortlessHostnames({
			...(options.workspaceRoot ? { startDir: options.workspaceRoot } : {}),
			env,
		});
		values['ACCOUNT_PORTAL_OIDC_ISSUER'] = buildPortlessUrl(hostnames.mockAuth, '/community');
		values['ACCOUNT_PORTAL_OIDC_ENDPOINT'] = buildPortlessUrl(hostnames.mockAuth, '/community/.well-known/jwks.json');
		values['STAFF_PORTAL_OIDC_ISSUER'] = buildPortlessUrl(hostnames.mockAuth, '/staff');
		values['STAFF_PORTAL_OIDC_ENDPOINT'] = buildPortlessUrl(hostnames.mockAuth, '/staff/.well-known/jwks.json');
		const azurite = getAzuriteConnectionString({
			...(options.workspaceRoot ? { startDir: options.workspaceRoot } : {}),
			env,
			values,
		});
		values['AZURE_STORAGE_CONNECTION_STRING'] = azurite;
		values['AzureWebJobsStorage'] = azurite;
	}

	if (env['COSMOSDB_CONNECTION_STRING']) {
		values['COSMOSDB_CONNECTION_STRING'] = env['COSMOSDB_CONNECTION_STRING'];
	}

	settings.Values = values;
	return settings;
}

/**
 * Syncs `apps/api/deploy/local.settings.json` from the local or e2e source file.
 */
export function syncApiLocalSettings(options: SyncApiLocalSettingsOptions = {}): void {
	const env = options.env ?? process.env;
	const appDir = path.resolve(options.appDir ?? process.cwd());
	const mode = options.mode ?? (['1', 'true', 'yes'].includes((env['E2E'] ?? '').toLowerCase()) ? 'e2e' : undefined);
	const localSettingsPath = path.join(appDir, 'local.settings.json');
	const e2eLocalSettingsPath = path.join(appDir, 'local-settings.e2e.json');
	const targetPath = path.join(appDir, 'deploy', 'local.settings.json');

	mkdirSync(path.dirname(targetPath), { recursive: true });

	if (!mode) {
		if (existsSync(localSettingsPath)) {
			copyFileSync(localSettingsPath, targetPath);
		}
		return;
	}

	if (mode !== 'e2e') {
		throw new Error(`[local-dev] Invalid mode: expected one of e2e, received "${mode}"`);
	}

	if (!existsSync(e2eLocalSettingsPath)) {
		throw new Error(`[local-dev] Missing local settings for mode "e2e": ${e2eLocalSettingsPath}`);
	}

	const settings = JSON.parse(readFileSync(e2eLocalSettingsPath, 'utf8')) as ApiLocalSettingsDocument;
	applyApiLocalSettingsOverrides(settings, {
		workspaceRoot: options.workspaceRoot ?? appDir,
		env,
	});
	writeFileSync(targetPath, `${JSON.stringify(settings, null, '\t')}\n`);
}
