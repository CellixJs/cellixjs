import { ProcessUiTestServer } from '@cellix/serenity-framework/servers';
import { appPaths } from '../shared/environment/app-paths.ts';
import { getPortlessDevScript } from '../shared/environment/dev-script.ts';
import { buildUrl, getHostnames } from '../shared/environment/test-environment.ts';

const hostnames = getHostnames();

export const communityUiPortalServer = new ProcessUiTestServer({
	cwd: appPaths.uiCommunityDir,
	executable: 'pnpm',
	extraEnv: () => ({
		BROWSER: 'none',
		NODE_ENV: 'development',
	}),
	getUrl: () => buildUrl(hostnames.uiCommunity),
	isAlreadyRunning: () => Promise.resolve(false),
	probe: {
		url: () => buildUrl(hostnames.uiCommunity),
	},
	readyMarker: 'ready in',
	serverName: 'TestCommunityViteServer',
	spawnArgs: () => ['run', getPortlessDevScript()],
});
