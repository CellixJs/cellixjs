import { existsSync, readFileSync } from 'node:fs';

export type DotEnvValues = Record<string, string>;

/**
 * Reads a dotenv-style file into a plain key/value object.
 *
 * This helper intentionally supports only the portable subset needed by local
 * wrapper scripts: `KEY=value` lines, optional `export` prefixes, comments,
 * empty lines, and matching single or double quotes around values. It does not
 * expand variables or execute shell syntax.
 *
 * @param filePath - Dotenv file to read.
 * @returns Parsed values, or an empty object when the file does not exist.
 */
export function readDotEnv(filePath: string): DotEnvValues {
	if (!existsSync(filePath)) {
		return {};
	}

	const values: DotEnvValues = {};
	for (const line of readFileSync(filePath, 'utf8').split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) {
			continue;
		}

		const separatorIndex = trimmed.indexOf('=');
		if (separatorIndex === -1) {
			continue;
		}

		const key = trimmed.slice(0, separatorIndex).replace(/^export\s+/, '');
		const rawValue = trimmed.slice(separatorIndex + 1);
		const quote = rawValue.at(0);
		const value = (quote === '"' || quote === "'") && rawValue.endsWith(quote) ? rawValue.slice(1, -1) : rawValue;
		values[key] = value;
	}

	return values;
}
