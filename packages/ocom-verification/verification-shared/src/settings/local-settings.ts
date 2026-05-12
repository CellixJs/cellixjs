import path from 'node:path';
import { findWorkspaceRoot, readDotEnv, readJsonSettings, readSetting, requireSetting, resolveWorkspacePath } from './settings-utils.ts';

const workspaceRoot = findWorkspaceRoot();
const apiSettingsPath = resolveWorkspacePath(workspaceRoot, 'apps/api/local.settings.json');
const uiEnvPath = resolveWorkspacePath(workspaceRoot, 'apps/ui-community/.env');

const apiValues = readJsonSettings(apiSettingsPath);
const uiValues = readDotEnv(uiEnvPath);

export const apiSettings = {
	nodeEnv: readSetting(apiValues, 'NODE_ENV', 'development') ?? 'development',
	isDevelopment: (readSetting(apiValues, 'NODE_ENV', 'development') ?? 'development') === 'development',

	cosmosDbConnectionString: readSetting(apiValues, 'COSMOSDB_CONNECTION_STRING') ?? '',
	cosmosDbName: readSetting(apiValues, 'COSMOSDB_DBNAME', 'owner-community') ?? 'owner-community',
	cosmosDbPort: Number(readSetting(apiValues, 'COSMOSDB_PORT', '50000')),

	accountPortalOidcIssuer: readSetting(apiValues, 'ACCOUNT_PORTAL_OIDC_ISSUER') ?? '',
	accountPortalOidcEndpoint: readSetting(apiValues, 'ACCOUNT_PORTAL_OIDC_ENDPOINT') ?? '',
	accountPortalOidcAudience: readSetting(apiValues, 'ACCOUNT_PORTAL_OIDC_AUDIENCE', 'mock-client') ?? '',

	apiDir: path.dirname(apiSettingsPath),
	oauth2MockDir: path.join(workspaceRoot, 'apps', 'server-oauth2-mock'),
	uiDir: path.dirname(uiEnvPath),
} as const;

export const uiSettings = {
	baseUrl: requireSetting(uiValues, 'VITE_BASE_URL', 'VITE_BASE_URL is required in .env'),

	graphqlEndpoint: requireSetting(uiValues, 'VITE_FUNCTION_ENDPOINT', 'VITE_FUNCTION_ENDPOINT is required in .env'),
} as const;
