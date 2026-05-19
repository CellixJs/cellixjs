import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { isGracefulInterruptExit } from '../../build-pipeline/scripts/dev-process-exit.mjs';
import { buildPortlessUrl, getHostnames } from '../../build-pipeline/scripts/portless-hostnames.mjs';
import { getAzuriteConnectionString, getMongoConnectionString } from '../../build-pipeline/scripts/worktree-ports.mjs';

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

// Only inject worktree-scoped overrides when running in worktree mode.
// When WORKTREE_NAME is absent, local.settings.json remains the source of truth.
if (process.env.WORKTREE_NAME) {
	const hostnames = getHostnames();
	childEnv.ACCOUNT_PORTAL_OIDC_ISSUER = buildPortlessUrl(hostnames.mockAuth, '/community');
	childEnv.ACCOUNT_PORTAL_OIDC_ENDPOINT = buildPortlessUrl(hostnames.mockAuth, '/community/.well-known/jwks.json');
	childEnv.COSMOSDB_CONNECTION_STRING = getMongoConnectionString();
	childEnv.AZURE_STORAGE_CONNECTION_STRING = getAzuriteConnectionString();
	childEnv.AzureWebJobsStorage = getAzuriteConnectionString();
	// Disable the Node.js inspector — port 5858 is already used by the primary worktree.
	childEnv.languageWorkers__node__arguments = '';
}

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
