import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { fileExists, getDefaultSummaryPath } from "./utils.ts";

interface ParsedArgs {
	forceInit: boolean;
	initOnly: boolean;
	json: boolean;
	outputPath?: string;
	packageRoot?: string;
}

function parseArgs(argv: string[]): ParsedArgs {
	const parsed: ParsedArgs = {
		forceInit: false,
		initOnly: false,
		json: false,
	};

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		const next = argv[index + 1];

		switch (arg) {
			case "--":
				break;
			case "--package":
				parsed.packageRoot = next;
				index += 1;
				break;
			case "--output":
				parsed.outputPath = next;
				index += 1;
				break;
			case "--force-init":
				parsed.forceInit = true;
				break;
			case "--init-only":
				parsed.initOnly = true;
				break;
			case "--json":
				parsed.json = true;
				break;
			case "--help":
				printUsage();
				process.exit(0);
				break;
			default:
				throw new Error(`Unknown argument: ${arg}`);
		}
	}

	return parsed;
}

function printUsage(): void {
	console.log(`Usage:
  node --experimental-strip-types .agents/skills/cellix-tdd/evaluator/check-cellix-tdd.ts --package <package-root> [--output <summary.md>] [--init-only] [--force-init] [--json]`);
}

function runScript(scriptPath: string, args: string[]): number {
	const result = spawnSync(process.execPath, ["--experimental-strip-types", scriptPath, ...args], {
		cwd: process.cwd(),
		stdio: "inherit",
	});

	if (result.error) {
		throw result.error;
	}

	return result.status ?? 1;
}

function main(): void {
	const args = parseArgs(process.argv.slice(2));

	if (!args.packageRoot) {
		printUsage();
		process.exit(1);
	}

	const packageRoot = resolve(args.packageRoot);
	const outputPath = args.outputPath ? resolve(args.outputPath) : getDefaultSummaryPath(packageRoot);
	const initScriptPath = new URL("./init-cellix-tdd-summary.ts", import.meta.url);
	const evaluateScriptPath = new URL("./evaluate-cellix-tdd.ts", import.meta.url);

	if (!fileExists(outputPath) || args.forceInit) {
		console.log(`No summary found. Creating scaffold at ${outputPath}`);
		const initArgs = ["--package", packageRoot, "--output", outputPath];
		if (args.forceInit) {
			initArgs.push("--force");
		}
		const initStatus = runScript(initScriptPath.pathname, initArgs);
		if (initStatus !== 0) {
			process.exit(initStatus);
		}
		console.log("Summary scaffold created. Replace the TODO sections, then re-run the check.");
	}

	if (args.initOnly) {
		process.exit(0);
	}

	const evaluateArgs = ["--package", packageRoot, "--output", outputPath];
	if (args.json) {
		evaluateArgs.push("--json");
	}

	const evaluateStatus = runScript(evaluateScriptPath.pathname, evaluateArgs);
	process.exit(evaluateStatus);
}

main();
