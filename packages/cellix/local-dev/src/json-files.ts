import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export interface SyncJsonFileOptions<TData> {
	sourcePath: string;
	targetPath: string;
	transform?: (data: TData) => TData;
}

/**
 * Reads a JSON file and returns its parsed contents.
 */
export function readJsonFile<TData>(filePath: string): TData {
	return JSON.parse(readFileSync(filePath, 'utf8')) as TData;
}

/**
 * Writes a JSON document with stable indentation and a trailing newline.
 */
export function writeJsonFile(filePath: string, data: unknown): void {
	mkdirSync(path.dirname(filePath), { recursive: true });
	writeFileSync(filePath, `${JSON.stringify(data, null, '\t')}\n`);
}

/**
 * Copies a JSON file to a target location and optionally applies a transform.
 */
export function syncJsonFile<TData>(options: SyncJsonFileOptions<TData>): void {
	mkdirSync(path.dirname(options.targetPath), { recursive: true });

	if (!options.transform) {
		copyFileSync(options.sourcePath, options.targetPath);
		return;
	}

	if (!existsSync(options.sourcePath)) {
		throw new Error(`[local-dev] Missing JSON source file: ${options.sourcePath}`);
	}

	const sourceData = readJsonFile<TData>(options.sourcePath);
	writeJsonFile(options.targetPath, options.transform(sourceData));
}
