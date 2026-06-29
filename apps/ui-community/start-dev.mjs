import { spawn } from 'node:child_process';
import { forwardChildExit } from '../../scripts/local-dev/dev-process-exit.mjs';
import { buildPortlessUrl, getHostnames } from '../../scripts/local-dev/portless-hostnames.mjs';
import { buildViteArgs } from '../../scripts/local-dev/vite-dev-args.mjs';

const childEnv = { ...process.env };

// Worktree-scoped overrides; plain `dev` leaves .env as the source of truth.
if (process.env.WORKTREE_NAME) {
	const hostnames = getHostnames();
	childEnv.VITE_APP_UI_COMMUNITY_END_USER_B2C_AUTHORITY = buildPortlessUrl(hostnames.mockAuth, '/community-end-user');
	childEnv.VITE_APP_UI_COMMUNITY_END_USER_B2C_REDIRECT_URI = buildPortlessUrl(hostnames.uiCommunity, '/auth-redirect');
	childEnv.VITE_COMMON_API_ENDPOINT = buildPortlessUrl(hostnames.api, '/api/graphql');
	childEnv.VITE_APP_UI_COMMUNITY_BASE_URL = buildPortlessUrl(hostnames.uiCommunity);
}

const viteArgs = buildViteArgs({ host: process.env.HOST, port: process.env.PORT });

const child = spawn('vite', viteArgs, {
	stdio: 'inherit',
	env: childEnv,
});

forwardChildExit(child);
