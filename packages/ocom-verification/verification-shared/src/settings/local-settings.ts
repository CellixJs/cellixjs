import path from 'node:path';
import { findWorkspaceRoot, readDotEnv, readJsonSettings, readSetting, requireSetting, resolveWorkspacePath } from './settings-utils.ts';

const workspaceRoot = findWorkspaceRoot();
const apiSettingsPath = resolveWorkspacePath(workspaceRoot, 'apps/api/local.settings.json');
const uiEnvPath = resolveWorkspacePath(workspaceRoot, 'apps/ui-community/.env');

const apiValues = readJsonSettings(apiSettingsPath);
const uiValues = readDotEnv(uiEnvPath);

const portlessPort = Number(readSetting(apiValues, 'PORTLESS_PORT', '1355') ?? '1355');
const oidcHost = readSetting(apiValues, 'OIDC_HOST', 'mock-auth.ownercommunity.localhost') ?? 'mock-auth.ownercommunity.localhost';

const oidcBaseUrl = `https://${oidcHost}:${portlessPort}`;

export const apiSettings = {
	nodeEnv: readSetting(apiValues, 'NODE_ENV', 'development') ?? 'development',
	isDevelopment: (readSetting(apiValues, 'NODE_ENV', 'development') ?? 'development') === 'development',

	cosmosDbConnectionString: readSetting(apiValues, 'COSMOSDB_CONNECTION_STRING') ?? '',
	cosmosDbName: readSetting(apiValues, 'COSMOSDB_DBNAME', 'owner-community') ?? 'owner-community',
	cosmosDbPort: Number(readSetting(apiValues, 'COSMOSDB_PORT', '50000')),

	accountPortalOidcIssuer: readSetting(apiValues, 'ACCOUNT_PORTAL_OIDC_ISSUER', `${oidcBaseUrl}/community`) ?? `${oidcBaseUrl}/community`,
	accountPortalOidcEndpoint: readSetting(apiValues, 'ACCOUNT_PORTAL_OIDC_ENDPOINT', `${oidcBaseUrl}/community/.well-known/jwks.json`) ?? `${oidcBaseUrl}/community/.well-known/jwks.json`,
	accountPortalOidcAudience: readSetting(apiValues, 'ACCOUNT_PORTAL_OIDC_AUDIENCE', 'mock-client') ?? 'mock-client',

	apiDir: path.dirname(apiSettingsPath),
	oauth2MockDir: path.join(workspaceRoot, 'apps', 'server-oauth2-mock'),
	uiCommunityDir: path.dirname(uiEnvPath),
} as const;

export const uiSettings = {
	baseUrl: requireSetting(uiValues, 'VITE_BASE_URL', 'VITE_BASE_URL is required in .env'),

	graphqlEndpoint: requireSetting(uiValues, 'VITE_FUNCTION_ENDPOINT', 'VITE_FUNCTION_ENDPOINT is required in .env'),
} as const;
