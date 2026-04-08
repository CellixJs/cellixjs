import { spawn } from 'node:child_process';

const port = process.env.PORT ?? '3001';

const child = spawn('docusaurus', ['start', '--port', port, '--host', '127.0.0.1', '--no-open'], {
	stdio: 'inherit',
});

child.on('exit', (code, signal) => {
	// Turbo sends signals to interrupt persistent tasks; treat those as graceful exits.
	if (signal === 'SIGINT' || signal === 'SIGTERM' || signal === 'SIGQUIT') {
		process.exitCode = 0;
		return;
	}
	process.exitCode = code ?? 1;
});
