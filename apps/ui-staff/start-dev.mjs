import { spawn } from 'node:child_process';
import { isGracefulInterruptExit } from '../../build-pipeline/scripts/dev-process-exit.mjs';
import { buildPortlessUrl, getHostnames } from '../../build-pipeline/scripts/portless-hostnames.mjs';

const childEnv = { ...process.env };

if (process.env.WORKTREE_NAME) {
	const hostnames = getHostnames();
	childEnv.VITE_APP_UI_STAFF_AAD_AUTHORITY = buildPortlessUrl(hostnames.mockAuth, '/staff');
	childEnv.VITE_APP_UI_STAFF_AAD_REDIRECT_URI = buildPortlessUrl(hostnames.uiStaff, '/auth-redirect');
	childEnv.VITE_COMMON_API_ENDPOINT = buildPortlessUrl(hostnames.api, '/api/graphql');
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
