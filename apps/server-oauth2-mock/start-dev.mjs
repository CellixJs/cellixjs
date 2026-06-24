import { spawn } from 'node:child_process';
import { forwardChildExit } from '../../scripts/local-dev/dev-process-exit.mjs';
import { buildPortlessUrl, getHostnames } from '../../scripts/local-dev/portless-hostnames.mjs';

const childEnv = { ...process.env };

if (process.env.WORKTREE_NAME) {
	const hostnames = getHostnames();
	childEnv.BASE_URL = buildPortlessUrl(hostnames.mockAuth);
	// Override redirect URIs so portal-discovery picks up worktree-scoped URLs.
	childEnv.VITE_APP_UI_COMMUNITY_B2C_REDIRECT_URI = buildPortlessUrl(hostnames.uiCommunity, '/auth-redirect');
	childEnv.VITE_APP_UI_STAFF_AAD_REDIRECT_URI = buildPortlessUrl(hostnames.uiStaff, '/auth-redirect');
}

const child = spawn('tsx', ['src/index.ts'], {
	stdio: 'inherit',
	env: childEnv,
});

forwardChildExit(child);
