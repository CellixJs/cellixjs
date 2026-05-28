import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPortlessUrl, getHostnames } from '../../../scripts/local-dev/portless-hostnames.mjs';
import { getAzuriteConnectionString } from '../../../scripts/local-dev/worktree-ports.mjs';

const apiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2] ?? (isE2E() ? 'e2e' : undefined);
const localSettingsPath = path.join(apiDir, 'local.settings.json');
const e2eLocalSettingsPath = path.join(apiDir, 'local-settings.e2e.json');
const targetPath = path.join(apiDir, 'deploy', 'local.settings.json');

mkdirSync(path.dirname(targetPath), { recursive: true });

if (!mode) {
	if (existsSync(localSettingsPath)) {
		copyFileSync(localSettingsPath, targetPath);
	}
	process.exit(0);
}

if (mode !== 'e2e') {
	throw new Error('[sync-local-settings] Invalid mode: expected one of e2e');
}

if (!existsSync(e2eLocalSettingsPath)) {
	throw new Error(`[sync-local-settings] Missing local settings for mode "e2e": ${e2eLocalSettingsPath}`);
}

const settings = JSON.parse(readFileSync(e2eLocalSettingsPath, 'utf-8'));
applyE2EOverrides(settings);
writeFileSync(targetPath, `${JSON.stringify(settings, null, '\t')}\n`);

function applyE2EOverrides(settings) {
	const values = { ...(settings.Values ?? {}) };

	// Worktree-scoped overrides: when WORKTREE_NAME is set the proxy hostnames
	// and Azurite ports are scoped to that worktree, so we rewrite the URLs and
	// connection strings here. Without WORKTREE_NAME the committed JSON values
	// already match the default hostnames, so we leave them alone.
	if (process.env.WORKTREE_NAME) {
		const hostnames = getHostnames();
		values.ACCOUNT_PORTAL_OIDC_ISSUER = buildPortlessUrl(hostnames.mockAuth, '/community');
		values.ACCOUNT_PORTAL_OIDC_ENDPOINT = buildPortlessUrl(hostnames.mockAuth, '/community/.well-known/jwks.json');
		values.STAFF_PORTAL_OIDC_ISSUER = buildPortlessUrl(hostnames.mockAuth, '/staff');
		values.STAFF_PORTAL_OIDC_ENDPOINT = buildPortlessUrl(hostnames.mockAuth, '/staff/.well-known/jwks.json');
		const azurite = getAzuriteConnectionString(values);
		values.AZURE_STORAGE_CONNECTION_STRING = azurite;
		values.AzureWebJobsStorage = azurite;
	}

	// Runtime-only injection: the e2e harness spawns MongoMemoryServer on a
	// random port and passes the connection string through process.env.
	if (process.env.COSMOSDB_CONNECTION_STRING) {
		values.COSMOSDB_CONNECTION_STRING = process.env.COSMOSDB_CONNECTION_STRING;
	}

	settings.Values = values;
}

function isE2E() {
	return ['1', 'true', 'yes'].includes((process.env.E2E ?? '').toLowerCase());
}
