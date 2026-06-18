#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

const buildStatus = runSilent('pnpm', ['--filter', '@cellix/local-dev', 'build']);
const compileStatus = buildStatus === 0 ? runSilent('pnpm', ['exec', 'tsgo', '--project', 'scripts/tsconfig.verify.json']) : buildStatus;

if (compileStatus !== 0) {
	process.exitCode = compileStatus;
} else {
	const verifyResult = spawnSync(process.execPath, ['packages/cellix/local-dev/.verify-dist/scripts/verify.js'], {
		stdio: 'inherit',
	});

	process.exitCode = verifyResult.status ?? 1;
}

function runSilent(command, args) {
	const result = spawnSync(command, args, {
		encoding: 'utf8',
		stdio: 'pipe',
	});
	const status = result.status ?? 1;

	if (status !== 0) {
		process.stdout.write(result.stdout ?? '');
		process.stderr.write(result.stderr ?? '');
		if (result.error) {
			process.stderr.write(`${result.error.message}\n`);
		}
	}

	return status;
}
