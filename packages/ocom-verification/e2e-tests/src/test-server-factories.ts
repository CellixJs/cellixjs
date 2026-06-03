import { join } from 'node:path';
import { ProcessTestServer } from '@cellix/serenity-framework/servers';
import { getAzuritePorts } from '@ocom-verification/verification-shared/environment';
import { appPaths } from './shared/environment/app-paths.ts';
import { e2eEnv, getPortlessDevScript } from './shared/environment/dev-script.ts';
import { buildUrl, getHostnames, mockOidcEndpoint, mockOidcIssuer } from './shared/environment/test-environment.ts';

export { cleanupTestEnvironment, initTestEnvironment } from './shared/environment/test-environment.ts';

const hostnames = getHostnames();

export function createTestApiServer(getMongoConnectionString: () => string): ProcessTestServer {
	return new ProcessTestServer({
		cwd: appPaths.apiDir,
		executable: 'pnpm',
		extraEnv: () =>
			e2eEnv({
				COSMOSDB_CONNECTION_STRING: getMongoConnectionString(),
			}),
		getUrl: () => buildUrl(hostnames.api, '/api/graphql'),
		probe: {
			url: () => buildUrl(hostnames.api, '/api/graphql'),
			requestInit: () => ({
				body: JSON.stringify({ query: '{ __typename }' }),
				headers: { 'Content-Type': 'application/json' },
				method: 'POST',
			}),
			isHealthy: async (response) => {
				if (!response.ok) {
					return false;
				}

				const payload = (await response.json().catch(() => null)) as {
					data?: { __typename?: string };
					errors?: unknown[];
				} | null;

				return payload?.data?.__typename === 'Query' && !payload.errors?.length;
			},
		},
		readyMarker: 'Functions:',
		serverName: 'TestApiServer',
		spawnArgs: () => ['run', getPortlessDevScript()],
	});
}

export function createTestAzuriteServer(): ProcessTestServer {
	return new ProcessTestServer({
		cwd: appPaths.apiDir,
		executable: 'node',
		extraEnv: () => {
			const binDir = join(appPaths.apiDir, 'node_modules', '.bin');
			const { PATH: pathValue = '' } = process.env;
			return { PATH: `${binDir}:${pathValue}` };
		},
		getUrl: () => `http://127.0.0.1:${getAzuritePorts().blob}`,
		isAlreadyRunning: async () => false,
		isReusableExit: (stderrOutput) => stderrOutput.includes('EADDRINUSE'),
		probe: false,
		readyMarker: '[azurite] started',
		serverName: 'TestAzuriteServer',
		spawnArgs: ['start-azurite.mjs'],
	});
}

export function createTestOAuth2Server(): ProcessTestServer {
	return new ProcessTestServer({
		cwd: appPaths.oauth2MockDir,
		executable: 'pnpm',
		getUrl: () => mockOidcIssuer,
		probe: {
			url: mockOidcEndpoint,
		},
		readyMarker: 'Registered OIDC config',
		serverName: 'TestOAuth2Server',
		spawnArgs: () => ['run', getPortlessDevScript()],
	});
}

export function createCommunityUiPortalServer(): ProcessTestServer {
	return new ProcessTestServer({
		cwd: appPaths.uiCommunityDir,
		executable: 'pnpm',
		extraEnv: () => ({
			BROWSER: 'none',
			NODE_ENV: 'development',
		}),
		getUrl: () => buildUrl(hostnames.uiCommunity),
		readyMarker: 'ready in',
		serverName: 'TestCommunityViteServer',
		spawnArgs: () => ['run', getPortlessDevScript()],
	});
}

export function createStaffUiPortalServer(): ProcessTestServer {
	return new ProcessTestServer({
		cwd: appPaths.uiStaffDir,
		executable: 'pnpm',
		extraEnv: () => ({
			BROWSER: 'none',
			NODE_ENV: 'development',
		}),
		getUrl: () => buildUrl(hostnames.uiStaff),
		readyMarker: 'ready in',
		serverName: 'TestStaffViteServer',
		spawnArgs: () => ['run', getPortlessDevScript()],
	});
}
