import { spawn } from 'node:child_process';
import { forwardChildExit } from '../../scripts/local-dev/dev-process-exit.mjs';
import { buildPortlessUrl, getHostnames } from '../../scripts/local-dev/portless-hostnames.mjs';

const childEnv = { ...process.env };

if (process.env.WORKTREE_NAME) {
	const hostnames = getHostnames();
	childEnv.VITE_APP_UI_STAFF_AAD_AUTHORITY = buildPortlessUrl(hostnames.mockAuth, '/staff');
	childEnv.VITE_APP_UI_STAFF_AAD_REDIRECT_URI = buildPortlessUrl(hostnames.uiStaff, '/auth-redirect');
	childEnv.VITE_COMMON_API_ENDPOINT = buildPortlessUrl(hostnames.api, '/api/graphql');
}

const viteArgs = ['--port', process.env.PORT, '--host', process.env.HOST ?? '127.0.0.1'];
const viteMode = process.env.E2E_VITE_MODE ?? (process.env.TF_BUILD ? 'e2e' : undefined);
if (viteMode) {
	viteArgs.push('--mode', viteMode);
}

const child = spawn('vite', viteArgs, {
	stdio: 'inherit',
	env: childEnv,
});

forwardChildExit(child);
