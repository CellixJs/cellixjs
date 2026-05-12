import process from 'node:process';

export interface EvaluateParsedArgs {
	fixtureDir?: string;
	fixturesRoot?: string;
	packageRoot?: string;
	outputPath?: string;
	verifyExpected: boolean;
	json: boolean;
}

export function parseEvaluateArgs(argv: string[]): EvaluateParsedArgs {
	const parsed: EvaluateParsedArgs = {
		verifyExpected: false,
		json: false,
	};

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		const next = argv[index + 1];

		switch (arg) {
			case '--':
				index = argv.length;
				break;
			case '--fixture':
				parsed.fixtureDir = next;
				index += 1;
				break;
			case '--fixtures-root':
				parsed.fixturesRoot = next;
				index += 1;
				break;
			case '--package':
				parsed.packageRoot = next;
				index += 1;
				break;
			case '--output':
				parsed.outputPath = next;
				index += 1;
				break;
			case '--verify-expected':
				parsed.verifyExpected = true;
				break;
			case '--json':
				parsed.json = true;
				break;
			case '--help':
				printEvaluateUsage();
				process.exit(0);
				break;
			default:
				throw new Error(`Unknown argument: ${arg}`);
		}
	}

	return parsed;
}

export function printEvaluateUsage(): void {
	console.log(`Usage:
  node --experimental-strip-types .agents/skills/cellix-tdd/evaluator/evaluate-cellix-tdd.ts --fixture <fixture-dir> [--verify-expected] [--json]
  node --experimental-strip-types .agents/skills/cellix-tdd/evaluator/evaluate-cellix-tdd.ts --fixtures-root <fixtures-dir> --verify-expected [--json]
  node --experimental-strip-types .agents/skills/cellix-tdd/evaluator/evaluate-cellix-tdd.ts --package <package-root> [--output <skill-summary.md>] [--json]`);
}

export interface CheckParsedArgs {
	forceInit: boolean;
	initOnly: boolean;
	json: boolean;
	outputPath?: string;
	packageRoot?: string;
}

export function parseCheckArgs(argv: string[]): CheckParsedArgs {
	const parsed: CheckParsedArgs = {
		forceInit: false,
		initOnly: false,
		json: false,
	};

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		const next = argv[index + 1];

		switch (arg) {
			case '--':
				index = argv.length;
				break;
			case '--package':
				parsed.packageRoot = next;
				index += 1;
				break;
			case '--output':
				parsed.outputPath = next;
				index += 1;
				break;
			case '--force-init':
				parsed.forceInit = true;
				break;
			case '--init-only':
				parsed.initOnly = true;
				break;
			case '--json':
				parsed.json = true;
				break;
			case '--help':
				printCheckUsage();
				process.exit(0);
				break;
			default:
				throw new Error(`Unknown argument: ${arg}`);
		}
	}

	return parsed;
}

export function printCheckUsage(): void {
	console.log(`Usage:
  node --experimental-strip-types .agents/skills/cellix-tdd/evaluator/check-cellix-tdd.ts --package <package-root> [--output <summary.md>] [--init-only] [--force-init] [--json]`);
}
