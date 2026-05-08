import path from 'node:path';
import { findWorkspaceRoot, readDotEnv, readJsonSettings, readSetting, requireSetting, resolveWorkspacePath } from './settings-utils.ts';

const workspaceRoot = findWorkspaceRoot();
const apiSettingsPath = resolveWorkspacePath(workspaceRoot, 'apps/api/local.settings.json');
const uiEnvPath = resolveWorkspacePath(workspaceRoot, 'apps/ui-community/.env');

const apiValues = readJsonSettings(apiSettingsPath);
const uiValues = readDotEnv(uiEnvPath);

/**
 * Defaults for E2E/acceptance test settings when local.settings.json is absent
 * (e.g. CI pipelines). All values are non-secret mock/localhost references used
 * exclusively by the test harness — no real credentials are involved.
 */
const ciDefaults = {
	COSMOSDB_CONNECTION_STRING: '',
	COSMOSDB_DBNAME: 'owner-community',
	COSMOSDB_PORT: '50000',
	NODE_ENV: 'development',
	ACCOUNT_PORTAL_OIDC_AUDIENCE: 'mock-client',
	ACCOUNT_PORTAL_OIDC_ISSUER: 'https://mock-auth.ownercommunity.localhost:1355/community',
	ACCOUNT_PORTAL_OIDC_ENDPOINT: 'https://mock-auth.ownercommunity.localhost:1355/community/.well-known/jwks.json',
} as const;

function setting(key: keyof typeof ciDefaults): string {
	return readSetting(apiValues, key, ciDefaults[key]) ?? ciDefaults[key];
}

export const apiSettings = {
	nodeEnv: setting('NODE_ENV'),
	isDevelopment: setting('NODE_ENV') === 'development',

	cosmosDbConnectionString: setting('COSMOSDB_CONNECTION_STRING'),
	cosmosDbName: setting('COSMOSDB_DBNAME'),
	cosmosDbPort: Number(setting('COSMOSDB_PORT')),

	accountPortalOidcIssuer: setting('ACCOUNT_PORTAL_OIDC_ISSUER'),
	accountPortalOidcEndpoint: setting('ACCOUNT_PORTAL_OIDC_ENDPOINT'),
	accountPortalOidcAudience: setting('ACCOUNT_PORTAL_OIDC_AUDIENCE'),

	apiDir: path.dirname(apiSettingsPath),
	oauth2MockDir: path.join(workspaceRoot, 'apps', 'server-oauth2-mock'),
	uiCommunityDir: path.dirname(uiEnvPath),
} as const;

export const uiSettings = {
	baseUrl: requireSetting(uiValues, 'VITE_BASE_URL', 'VITE_BASE_URL is required in .env'),

	graphqlEndpoint: requireSetting(uiValues, 'VITE_COMMON_API_ENDPOINT', 'VITE_COMMON_API_ENDPOINT is required in .env'),
} as const;
