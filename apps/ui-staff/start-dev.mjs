import { spawn } from 'node:child_process';
import { isGracefulInterruptExit } from '../../build-pipeline/scripts/dev-process-exit.mjs';
import { buildPortlessUrl, getHostnames } from '../../build-pipeline/scripts/portless-hostnames.mjs';

const hostnames = getHostnames();

const child = spawn('vite', ['--port', process.env.PORT, '--host', process.env.HOST ?? '127.0.0.1'], {
	stdio: 'inherit',
	env: {
		...process.env,
		VITE_APP_UI_STAFF_AAD_AUTHORITY: buildPortlessUrl(hostnames.mockAuth, '/staff'),
		VITE_APP_UI_STAFF_AAD_REDIRECT_URI: buildPortlessUrl(hostnames.uiStaff, '/auth-redirect'),
		VITE_COMMON_API_ENDPOINT: buildPortlessUrl(hostnames.api, '/api/graphql'),
	},
});

child.on('exit', (code, signal) => {
	if (isGracefulInterruptExit(signal, code)) {
		process.exitCode = 0;
		return;
	}
	process.exitCode = code ?? 1;
});
