import fs from 'node:fs';
import path from 'node:path';

/**
 * Walks up from `startDir` looking for pnpm-workspace.yaml to locate the
 * monorepo root. Projects that use a different workspace marker should pass a
 * custom `markerFile`.
 */
export function findWorkspaceRoot(startDir = import.meta.dirname, markerFile = 'pnpm-workspace.yaml'): string {
	let dir = startDir;

	while (dir !== path.dirname(dir)) {
		if (fs.existsSync(path.join(dir, markerFile))) {
			return dir;
		}
		dir = path.dirname(dir);
	}

	throw new Error(`Could not find workspace root (${markerFile})`);
}

/**
 * Reads an Azure Functions-style settings file ({ "Values": { ... } }) and
 * returns the Values map. Returns `{}` if the file doesn't exist.
 */
export function readJsonSettings(filePath: string): Record<string, string> {
	if (!fs.existsSync(filePath)) {
		return {};
	}
	const raw = fs.readFileSync(filePath, 'utf-8');
	const parsed = JSON.parse(raw) as { Values?: Record<string, string> };
	return parsed.Values ?? {};
}

/**
 * Reads a simple `KEY=VALUE` .env file. Ignores blank lines and `#` comments.
 * Returns `{}` if the file doesn't exist.
 */
export function readDotEnv(filePath: string): Record<string, string> {
	if (!fs.existsSync(filePath)) {
		return {};
	}

	const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
	const result: Record<string, string> = {};

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) {
			continue;
		}

		const eqIndex = trimmed.indexOf('=');
		if (eqIndex === -1) {
			continue;
		}

		result[trimmed.slice(0, eqIndex)] = trimmed.slice(eqIndex + 1);
	}

	return result;
}

/**
 * Resolves a target path against the workspace root unless it's already
 * absolute.
 */
export function resolveWorkspacePath(workspaceRoot: string, targetPath: string): string {
	return path.isAbsolute(targetPath) ? targetPath : path.join(workspaceRoot, targetPath);
}

/**
 * Returns the value for `key`, or `defaultValue` if absent/empty. Use this
 * when an optional setting has a reasonable default.
 */
export function readSetting(values: Record<string, string>, key: string, defaultValue?: string): string | undefined {
	return values[key] ?? defaultValue;
}

/**
 * Returns the value for `key`. Throws `errorMessage` if the value is missing
 * or empty. Use this when a setting is required for the test run to work.
 */
export function requireSetting(values: Record<string, string>, key: string, errorMessage: string): string {
	const value = values[key];
	if (value) {
		return value;
	}
	throw new Error(errorMessage);
}
