import { ProcessUiTestServer } from '@cellix/serenity-framework/servers';
import { appPaths } from '../shared/environment/app-paths.ts';
import { buildUrl, getHostnames } from '../shared/environment/test-environment.ts';

const hostnames = getHostnames();
const communityUrl = buildUrl(hostnames.uiCommunity);

export const communityUiPortalServer = new ProcessUiTestServer({
	cwd: appPaths.uiCommunityDir,
	executable: 'pnpm',
	readyMarker: 'ready in',
	serverName: 'TestCommunityViteServer',
	spawnArgs: () => ['run', process.env['WORKTREE_NAME'] ? 'dev:worktree' : 'dev'],
	url: communityUrl,
});
