import { ProcessUiTestServer } from '@cellix/serenity-framework/servers';
import { appPaths } from '../shared/environment/app-paths.ts';
import { buildUrl, getHostnames } from '../shared/environment/test-environment.ts';

const hostnames = getHostnames();
const staffUrl = buildUrl(hostnames.uiStaff);

export const staffUiPortalServer = new ProcessUiTestServer({
	cwd: appPaths.uiStaffDir,
	executable: 'pnpm',
	readyMarker: 'ready in',
	serverName: 'TestStaffViteServer',
	spawnArgs: () => ['run', process.env['WORKTREE_NAME'] ? 'dev:worktree' : 'dev'],
	url: staffUrl,
});
