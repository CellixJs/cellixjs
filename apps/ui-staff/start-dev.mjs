import { spawn } from 'node:child_process';
import { forwardChildExit } from '../../scripts/local-dev/dev-process-exit.mjs';
import { buildPortlessUrl, getHostnames } from '../../scripts/local-dev/portless-hostnames.mjs';
import { buildViteArgs } from '../../scripts/local-dev/vite-dev-args.mjs';

const childEnv = { ...process.env };

if (process.env.WORKTREE_NAME) {
	const hostnames = getHostnames();
	childEnv.VITE_APP_UI_STAFF_AAD_AUTHORITY = buildPortlessUrl(hostnames.mockAuth, '/staff-staff-user');
	childEnv.VITE_APP_UI_STAFF_STAFF_USER_AAD_REDIRECT_URI = buildPortlessUrl(hostnames.uiStaff, '/auth-redirect');
	childEnv.VITE_COMMON_API_ENDPOINT = buildPortlessUrl(hostnames.api, '/api/graphql');
}

const viteArgs = buildViteArgs({ host: process.env.HOST, port: process.env.PORT });

const child = spawn('vite', viteArgs, {
	stdio: 'inherit',
	env: childEnv,
});

forwardChildExit(child);
