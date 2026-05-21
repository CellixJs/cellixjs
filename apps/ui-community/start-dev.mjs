import { spawn } from 'node:child_process';
import { isGracefulInterruptExit } from '../../build-pipeline/scripts/dev-process-exit.mjs';
import { buildPortlessUrl, getHostnames } from '../../build-pipeline/scripts/portless-hostnames.mjs';

const childEnv = { ...process.env };

// Worktree-scoped overrides; plain `dev` leaves .env as the source of truth.
if (process.env.WORKTREE_NAME) {
	const hostnames = getHostnames();
	childEnv.VITE_APP_UI_COMMUNITY_B2C_AUTHORITY = buildPortlessUrl(hostnames.mockAuth, '/community');
	childEnv.VITE_APP_UI_COMMUNITY_B2C_REDIRECT_URI = buildPortlessUrl(hostnames.uiCommunity, '/auth-redirect');
	childEnv.VITE_COMMON_API_ENDPOINT = buildPortlessUrl(hostnames.api, '/api/graphql');
	childEnv.VITE_APP_UI_COMMUNITY_BASE_URL = buildPortlessUrl(hostnames.uiCommunity);
}

const child = spawn('vite', ['--port', process.env.PORT, '--host', process.env.HOST ?? '127.0.0.1'], {
	stdio: 'inherit',
	env: childEnv,
});

child.on('exit', (code, signal) => {
	if (isGracefulInterruptExit(signal, code)) {
		process.exitCode = 0;
		return;
	}
	process.exitCode = code ?? 1;
});
