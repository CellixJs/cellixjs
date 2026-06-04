#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const child = spawn(process.execPath, ['--experimental-strip-types', fileURLToPath(new URL('../src/bin.ts', import.meta.url)), ...process.argv.slice(2)], {
	stdio: 'inherit',
});

child.on('error', (error) => {
	console.error(`[local-dev] failed to start CLI: ${error.message}`);
	process.exit(1);
});

child.on('exit', (code, signal) => {
	if (signal) {
		process.kill(process.pid, signal);
		return;
	}

	process.exit(code ?? 1);
});
