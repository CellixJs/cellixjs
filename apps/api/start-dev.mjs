import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { isGracefulInterruptExit } from '../../build-pipeline/scripts/dev-process-exit.mjs';

const envPort = process.env.PORT;

if (!envPort) {
	console.error('PORT environment variable is not set. Start this command through portless.');
	process.exit(1);
}

const portlessCaPath = process.env.PORTLESS_CA_PATH ?? path.join(os.homedir(), '.portless', 'ca.pem');

const childEnv = {
	...process.env,
	NODE_EXTRA_CA_CERTS: portlessCaPath,
	NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --use-system-ca`.trim(),
};

// `--cors '*'` matches Host.CORS in local.settings.json but does not depend on
// that file existing — local.settings.json is gitignored, so CI has no CORS
// allowance otherwise and the UI's cross-origin GraphQL requests are blocked.
const child = spawn('func', ['start', '--typescript', '--script-root', 'deploy/', '--port', envPort, '--cors', '*'], {
	stdio: 'inherit',
	env: childEnv,
});

child.on('exit', (code, signal) => {
	// Turbo sends signals to interrupt persistent tasks; treat those as graceful exits.
	if (isGracefulInterruptExit(signal, code)) {
		process.exitCode = 0;
		return;
	}
	process.exitCode = code ?? 1;
});
