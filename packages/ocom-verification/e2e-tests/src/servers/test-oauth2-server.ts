import { ProcessTestServer } from '@cellix/serenity-framework/servers';
import { appPaths } from '../shared/environment/app-paths.ts';
import { buildUrl, getHostnames, mockOidcIssuer } from '../shared/environment/test-environment.ts';

const hostnames = getHostnames();

export const testOAuth2Server = new ProcessTestServer({
	cwd: appPaths.oauth2MockDir,
	executable: 'pnpm',
	getUrl: () => buildUrl(hostnames.mockAuth, new URL(mockOidcIssuer).pathname),
	isAlreadyRunning: () => Promise.resolve(false),
	probe: false,
	readyMarker: 'Registered OIDC config',
	serverName: 'TestOAuth2Server',
	spawnArgs: () => ['run', process.env['WORKTREE_NAME'] ? 'dev:worktree' : 'dev'],
});
