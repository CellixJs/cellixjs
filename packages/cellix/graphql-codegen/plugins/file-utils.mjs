import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function collectFiles(rootDir, suffix) {
	const entries = await fs.readdir(rootDir, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => {
			const entryPath = path.join(rootDir, entry.name);
			if (entry.isDirectory()) {
				return collectFiles(entryPath, suffix);
			}
			if (entry.isFile() && entry.name.endsWith(suffix)) {
				return [entryPath];
			}
			return [];
		}),
	);
	return files.flat().sort((a, b) => a.localeCompare(b));
}

export function toPosixPath(value) {
	return value.split(path.sep).join('/');
}
