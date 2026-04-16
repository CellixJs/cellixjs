import process from 'node:process';
import { validateRepoConfiguration } from '../lib/orchestration-validator.ts';

function parseArgs(argv: string[]): { repoRoot: string; json: boolean; specPath?: string } {
	let repoRoot = process.cwd();
	let json = false;
	let specPath: string | undefined;

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === '--repo') {
			repoRoot = argv[index + 1] ?? process.cwd();
			index += 1;
			continue;
		}

		if (arg === '--json') {
			json = true;
		}

		if (arg === '--spec') {
			specPath = argv[index + 1];
			index += 1;
		}
	}

	return { repoRoot, json, specPath };
}

function printReport(): void {
	const args = parseArgs(process.argv.slice(2));
	const report = validateRepoConfiguration(args.repoRoot, { specPath: args.specPath });

	if (args.json) {
		console.log(JSON.stringify(report, null, 2));
		process.exit(report.ok ? 0 : 1);
	}

	if (report.ok) {
		console.log('Orchestration configuration is valid.');
		process.exit(0);
	}

	console.error('Orchestration configuration is invalid:');
	for (const issue of report.errors) {
		console.error(`- [${issue.code}] ${issue.message}`);
		if (issue.suggestion) {
			console.error(`  suggestion: ${issue.suggestion}`);
		}
	}

	process.exit(1);
}

printReport();
