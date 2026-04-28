import * as fs from 'node:fs';
import * as path from 'node:path';

export function toPosixPath(value: string): string {
	return value.split(path.sep).join('/');
}

export function resolveSearchRoot(pattern: string): string {
	const [root] = pattern.split('*');
	return path.resolve(process.cwd(), root || '.');
}

export function fileExists(filePath: string): boolean {
	return fs.existsSync(filePath);
}

export function readFile(filePath: string): string {
	return fs.readFileSync(filePath, 'utf8');
}

export function getAllFiles(rootPath: string): string[] {
	if (!fileExists(rootPath)) {
		return [];
	}

	const files: string[] = [];
	const queue = [rootPath];

	while (queue.length > 0) {
		const currentPath = queue.pop() as string;
		const stats = fs.statSync(currentPath);
		if (stats.isDirectory()) {
			for (const entry of fs.readdirSync(currentPath)) {
				queue.push(path.join(currentPath, entry));
			}
			continue;
		}
		files.push(currentPath);
	}

	return files.sort((left, right) => left.localeCompare(right));
}

export function getFilesMatching(pattern: string, suffix: string): string[] {
	return getAllFiles(resolveSearchRoot(pattern)).filter((filePath) => filePath.endsWith(suffix));
}

export function getRelativeSegmentsAfter(filePath: string, anchor: string): string[] {
	const normalizedPath = toPosixPath(filePath);
	const anchorIndex = normalizedPath.lastIndexOf(anchor);
	if (anchorIndex === -1) {
		return [];
	}

	return normalizedPath
		.slice(anchorIndex + anchor.length)
		.split('/')
		.filter(Boolean);
}

export function getImmediateDirectories(rootPath: string): string[] {
	if (!fileExists(rootPath)) {
		return [];
	}

	return fs
		.readdirSync(rootPath, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => path.join(rootPath, entry.name))
		.sort((left, right) => left.localeCompare(right));
}

export function toPascalCase(value: string): string {
	return value
		.split(/[^a-zA-Z0-9]+/)
		.filter(Boolean)
		.map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
		.join('');
}
