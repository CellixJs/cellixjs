import { existsSync, readFileSync } from 'node:fs';

export type DotEnvValues = Record<string, string>;

/**
 * Reads a dotenv-style file into a plain key/value object.
 *
 * Lines without `=` and comment lines are ignored.
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

		values[trimmed.slice(0, separatorIndex)] = trimmed.slice(separatorIndex + 1);
	}

	return values;
}
