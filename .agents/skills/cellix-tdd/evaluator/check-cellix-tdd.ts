import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseCheckArgs, printCheckUsage } from './cli-utils.ts';
import { fileExists, getDefaultSummaryPath } from './utils.ts';

interface ParsedArgs {
	forceInit: boolean;
	initOnly: boolean;
	json: boolean;
	outputPath?: string;
	packageRoot?: string;
}

function runScript(scriptPath: string, args: string[]): number {
	const result = spawnSync(process.execPath, ['--experimental-strip-types', scriptPath, ...args], {
		cwd: process.cwd(),
		stdio: 'inherit',
	});

	if (result.error) {
		throw result.error;
	}

	return result.status ?? 1;
}

function main(): void {
	const args: ParsedArgs = parseCheckArgs(process.argv.slice(2));

	if (!args.packageRoot) {
		printCheckUsage();
		process.exit(1);
	}

	const packageRoot = resolve(args.packageRoot);
	const outputPath = args.outputPath ? resolve(args.outputPath) : getDefaultSummaryPath(packageRoot);
	const initScriptPath = fileURLToPath(new URL('./init-cellix-tdd-summary.ts', import.meta.url));
	const evaluateScriptPath = fileURLToPath(new URL('./evaluate-cellix-tdd.ts', import.meta.url));

	if (!fileExists(outputPath) || args.forceInit) {
		console.log(`No summary found. Creating scaffold at ${outputPath}`);
		const initArgs = ['--package', packageRoot, '--output', outputPath];
		if (args.forceInit) {
			initArgs.push('--force');
		}
		const initStatus = runScript(initScriptPath, initArgs);
		if (initStatus !== 0) {
			process.exit(initStatus);
		}
		console.log('Summary scaffold created. Replace the TODO sections, then re-run the check.');
	}

	if (args.initOnly) {
		process.exit(0);
	}

	const evaluateArgs = ['--package', packageRoot, '--output', outputPath];
	if (args.json) {
		evaluateArgs.push('--json');
	}

	const evaluateStatus = runScript(evaluateScriptPath, evaluateArgs);
	process.exit(evaluateStatus);
}

main();
