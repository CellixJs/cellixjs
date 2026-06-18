import { ProcessTestServer } from '@cellix/serenity-framework/servers';
import { appPaths } from '../shared/environment/app-paths.ts';
import { e2eEnv } from '../shared/environment/dev-script.ts';
import { buildUrl, getHostnames } from '../shared/environment/test-environment.ts';
import { testMongoServer } from './test-mongo-server.ts';

const hostnames = getHostnames();

export const testApiServer = new ProcessTestServer({
	cwd: appPaths.apiDir,
	executable: 'pnpm',
	extraEnv: () =>
		e2eEnv({
			COSMOSDB_CONNECTION_STRING: testMongoServer.getConnectionString(),
		}),
	getUrl: () => buildUrl(hostnames.api, '/api/graphql'),
	isAlreadyRunning: () => Promise.resolve(false),
	probe: {
		requestInit: () => ({
			body: JSON.stringify({ query: '{ __typename }' }),
			headers: { 'Content-Type': 'application/json' },
			method: 'POST',
		}),
		url: () => buildUrl(hostnames.api, '/api/graphql'),
	},
	readyMarker: 'Functions:',
	serverName: 'TestApiServer',
	spawnArgs: () => ['run', process.env['WORKTREE_NAME'] ? 'dev:worktree' : 'dev'],
});
