import { spawn } from 'node:child_process';
import { forwardChildExit } from '../../scripts/local-dev/dev-process-exit.mjs';
import { buildPortlessUrl, getHostnames } from '../../scripts/local-dev/portless-hostnames.mjs';

const childEnv = { ...process.env };

// Worktree-scoped overrides; plain `dev` leaves .env as the source of truth.
if (process.env.WORKTREE_NAME) {
	const hostnames = getHostnames();
	childEnv.VITE_APP_UI_COMMUNITY_B2C_AUTHORITY = buildPortlessUrl(hostnames.mockAuth, '/community');
	childEnv.VITE_APP_UI_COMMUNITY_B2C_REDIRECT_URI = buildPortlessUrl(hostnames.uiCommunity, '/auth-redirect');
	childEnv.VITE_COMMON_API_ENDPOINT = buildPortlessUrl(hostnames.api, '/api/graphql');
	childEnv.VITE_APP_UI_COMMUNITY_BASE_URL = buildPortlessUrl(hostnames.uiCommunity);
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
