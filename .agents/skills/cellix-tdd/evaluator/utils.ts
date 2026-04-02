import { existsSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import process from "node:process";

export function fileExists(filePath: string): boolean {
	return existsSync(filePath) && statSync(filePath).isFile();
}

export function directoryExists(filePath: string): boolean {
	return existsSync(filePath) && statSync(filePath).isDirectory();
}

export function getDefaultSummaryPath(packageRoot: string): string {
	const resolvedPackageRoot = resolve(packageRoot);
	const relativePackagePath = relative(process.cwd(), resolvedPackageRoot);

	return join(
		process.cwd(),
		".agents/skills/cellix-tdd/runs",
		relativePackagePath,
		"summary.md",
	);
}
