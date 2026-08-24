import { ProcessTestServer } from '@cellix/serenity-framework/servers';
import { appPaths } from '../shared/environment/app-paths.ts';
import { buildUrl, getHostnames } from '../shared/environment/test-environment.ts';

const hostnames = getHostnames();
const apiUrl = buildUrl(hostnames.api, '/api/graphql');

export const testApiServer = new ProcessTestServer({
	cwd: appPaths.apiDir,
	executable: 'pnpm',
	readyMarker: 'Functions:',
	serverName: 'TestApiServer',
	spawnArgs: () => ['run', process.env['WORKTREE_NAME'] ? 'dev:worktree' : 'dev'],
	url: apiUrl,
	// The portless route can reuse a stale local API port from a previous dev run;
	// clear those fixed listener ports before spinning up the Functions host.
	portsToCloseBeforeStart: [4280, 7071],
});
