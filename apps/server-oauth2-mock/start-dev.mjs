import { spawn } from 'node:child_process';
import { isGracefulInterruptExit } from '../../build-pipeline/scripts/dev-process-exit.mjs';
import { buildPortlessUrl, getHostnames } from '../../build-pipeline/scripts/portless-hostnames.mjs';

const hostnames = getHostnames();

const child = spawn('tsx', ['src/index.ts'], {
	stdio: 'inherit',
	env: {
		...process.env,
		BASE_URL: buildPortlessUrl(hostnames.mockAuth),
		// Override redirect URIs so portal-discovery picks up worktree-scoped URLs
		VITE_APP_UI_COMMUNITY_B2C_REDIRECT_URI: buildPortlessUrl(hostnames.uiCommunity, '/auth-redirect'),
		VITE_APP_UI_STAFF_AAD_REDIRECT_URI: buildPortlessUrl(hostnames.uiStaff, '/auth-redirect'),
	},
});

child.on('exit', (code, signal) => {
	if (isGracefulInterruptExit(signal, code)) {
		process.exitCode = 0;
		return;
	}
	process.exitCode = code ?? 1;
});
