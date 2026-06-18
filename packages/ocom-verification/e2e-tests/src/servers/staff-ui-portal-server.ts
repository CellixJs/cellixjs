import { ProcessUiTestServer } from '@cellix/serenity-framework/servers';
import { appPaths } from '../shared/environment/app-paths.ts';
import { buildUrl, getHostnames } from '../shared/environment/test-environment.ts';

const hostnames = getHostnames();

export const staffUiPortalServer = new ProcessUiTestServer({
	cwd: appPaths.uiStaffDir,
	executable: 'pnpm',
	extraEnv: () => ({
		BROWSER: 'none',
		NODE_ENV: 'development',
	}),
	getUrl: () => buildUrl(hostnames.uiStaff),
	isAlreadyRunning: () => Promise.resolve(false),
	probe: {
		url: () => buildUrl(hostnames.uiStaff),
	},
	readyMarker: 'ready in',
	serverName: 'TestStaffViteServer',
	spawnArgs: () => ['run', process.env['WORKTREE_NAME'] ? 'dev:worktree' : 'dev'],
});
