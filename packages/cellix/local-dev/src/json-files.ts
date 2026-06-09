import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export interface SyncJsonFileOptions<TData> {
	/** Source JSON document to copy or transform. */
	sourcePath: string;
	/** Destination path. Parent directories are created automatically. */
	targetPath: string;
	/** Optional consumer-owned transform applied before writing the target. */
	transform?: (data: TData) => TData;
}

/**
 * Reads a JSON file and returns its parsed contents.
 *
 * @param filePath - JSON file to parse.
 * @returns Parsed JSON typed by the caller.
 */
export function readJsonFile<TData>(filePath: string): TData {
	return JSON.parse(readFileSync(filePath, 'utf8')) as TData;
}

/**
 * Writes a JSON document with stable indentation and a trailing newline.
 *
 * @param filePath - Destination path. Parent directories are created
 * automatically.
 * @param data - JSON-serializable document to write.
 */
export function writeJsonFile(filePath: string, data: unknown): void {
	mkdirSync(path.dirname(filePath), { recursive: true });
	writeFileSync(filePath, `${JSON.stringify(data, null, '\t')}\n`);
}

/**
 * Copies a JSON file to a target location and optionally applies a transform.
 *
 * @param options - Source, target, and optional transform owned by the caller.
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
