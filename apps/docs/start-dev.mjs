import { spawn } from 'node:child_process';
import { forwardChildExit } from '../../scripts/local-dev/dev-process-exit.mjs';

const port = process.env.PORT ?? '3001';

const child = spawn('docusaurus', ['start', '--port', port, '--host', '127.0.0.1', '--no-open'], {
	stdio: 'inherit',
});

forwardChildExit(child);
