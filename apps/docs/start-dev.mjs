import { spawn } from 'node:child_process';
import { isGracefulInterruptExit } from '../../build-pipeline/scripts/dev-process-exit.mjs';

const port = process.env.PORT ?? '3001';

const child = spawn('docusaurus', ['start', '--port', port, '--host', '127.0.0.1', '--no-open'], {
	stdio: 'inherit',
});

child.on('exit', (code, signal) => {
	// Turbo sends signals to interrupt persistent tasks; treat those as graceful exits.
	if (isGracefulInterruptExit(signal, code)) {
		process.exitCode = 0;
		return;
	}
	process.exitCode = code ?? 1;
});
