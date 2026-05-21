import path from 'node:path';
import { findWorkspaceRoot, readDotEnv, readJsonSettings, readSetting, requireSetting, resolveWorkspacePath } from './settings-utils.ts';

const workspaceRoot = findWorkspaceRoot();
const apiSettingsPath = resolveWorkspacePath(workspaceRoot, 'apps/api/local.settings.json');
const uiEnvPath = resolveWorkspacePath(workspaceRoot, 'apps/ui-community/.env');

const apiValues = readJsonSettings(apiSettingsPath);
const uiValues = readDotEnv(uiEnvPath);

export const apiSettings = {
	cosmosDbConnectionString: readSetting(apiValues, 'COSMOSDB_CONNECTION_STRING', '') ?? '',
	cosmosDbName: readSetting(apiValues, 'COSMOSDB_DBNAME', 'owner-community') ?? 'owner-community',

	apiDir: path.dirname(apiSettingsPath),
	oauth2MockDir: path.join(workspaceRoot, 'apps', 'server-oauth2-mock'),
	uiCommunityDir: path.dirname(uiEnvPath),
} as const;

export const uiSettings = {
	baseUrl: requireSetting(uiValues, 'VITE_APP_UI_COMMUNITY_BASE_URL', 'VITE_APP_UI_COMMUNITY_BASE_URL is required in .env'),

	graphqlEndpoint: requireSetting(uiValues, 'VITE_COMMON_API_ENDPOINT', 'VITE_COMMON_API_ENDPOINT is required in .env'),
} as const;
