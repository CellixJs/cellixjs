import { spawn } from 'node:child_process';

const port = process.env.PORT ?? '3001';

const child = spawn('docusaurus', ['start', '--port', port, '--host', '127.0.0.1'], {
	stdio: 'inherit',
});

child.on('exit', (code, signal) => {
	process.exitCode = signal ? 1 : (code ?? 1);
});
