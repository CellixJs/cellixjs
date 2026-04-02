import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import process from "node:process";

interface ParsedArgs {
	force: boolean;
	outputPath?: string;
	packageRoot?: string;
}

function parseArgs(argv: string[]): ParsedArgs {
	const parsed: ParsedArgs = {
		force: false,
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
			case "--force":
				parsed.force = true;
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
  node --experimental-strip-types .agents/skills/cellix-tdd/evaluator/init-cellix-tdd-summary.ts --package <package-root> [--output <summary.md>] [--force]`);
}

function fileExists(filePath: string): boolean {
	return existsSync(filePath) && statSync(filePath).isFile();
}

function directoryExists(filePath: string): boolean {
	return existsSync(filePath) && statSync(filePath).isDirectory();
}

function getDefaultSummaryPath(packageRoot: string): string {
	const resolvedPackageRoot = resolve(packageRoot);
	const relativePackagePath = relative(process.cwd(), resolvedPackageRoot);

	return join(
		process.cwd(),
		".agents/skills/cellix-tdd/runs",
		relativePackagePath,
		"summary.md",
	);
}

function readTemplate(): string {
	return readFileSync(
		resolve(".agents/skills/cellix-tdd/templates/summary-template.md"),
		"utf8",
	);
}

function readPackageName(packageRoot: string): string {
	const packageJsonPath = join(packageRoot, "package.json");
	if (!fileExists(packageJsonPath)) {
		return relative(process.cwd(), packageRoot);
	}

	try {
		const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
			name?: string;
		};
		return packageJson.name ?? relative(process.cwd(), packageRoot);
	} catch {
		return relative(process.cwd(), packageRoot);
	}
}

function main(): void {
	const args = parseArgs(process.argv.slice(2));

	if (!args.packageRoot) {
		printUsage();
		process.exit(1);
	}

	const packageRoot = resolve(args.packageRoot);
	if (!directoryExists(packageRoot)) {
		throw new Error(`Package directory not found: ${packageRoot}`);
	}

	const outputPath = args.outputPath
		? resolve(args.outputPath)
		: getDefaultSummaryPath(packageRoot);

	if (fileExists(outputPath) && !args.force) {
		throw new Error(`Summary already exists: ${outputPath}\nUse --force to overwrite it.`);
	}

	mkdirSync(dirname(outputPath), { recursive: true });

	const summary = readTemplate()
		.replaceAll("{{PACKAGE_NAME}}", readPackageName(packageRoot))
		.replaceAll("{{PACKAGE_PATH}}", relative(process.cwd(), packageRoot))
		.replaceAll("{{SUMMARY_PATH}}", relative(process.cwd(), outputPath));

	writeFileSync(outputPath, summary, "utf8");

	console.log(outputPath);
}

main();
