import { spawn } from 'node:child_process';

const envPort = process.env.PORT;

if (!envPort) {
	console.error('PORT environment variable is not set. Start this command through portless.');
	process.exit(1);
}

const childEnv = {
	...process.env,
	NODE_EXTRA_CA_CERTS: `${process.env.HOME}/.portless/ca.pem`,
	NODE_OPTIONS: '--use-system-ca',
};

const child = spawn('func', ['start', '--typescript', '--script-root', 'deploy/', '--port', envPort], {
	stdio: 'inherit',
	env: childEnv,
});

child.on('exit', (code, signal) => {
	process.exitCode = signal ? 1 : (code ?? 1);
});
