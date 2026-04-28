import { type FileInfo, projectFiles } from 'archunit';

/**
 * Recursively get all files matching a glob pattern
 */
export async function getAllFiles(globPattern: string): Promise<string[]> {
	const files: string[] = [];
	await projectFiles()
		.inPath(globPattern)
		.should()
		.adhereTo((file: FileInfo) => {
			files.push(file.path);
			return true;
		}, 'collect files')
		.check();
	return files;
}

/**
 * Get immediate subdirectories using archunit
 */
export async function getDirectories(globPattern: string): Promise<string[]> {
	const dirs = new Set<string>();
	await projectFiles()
		.inPath(globPattern)
		.should()
		.adhereTo((file: FileInfo) => {
			const parts = file.path.split('/');
			const dirName = parts.at(-2);
			if (dirName) {
				dirs.add(dirName);
			}
			return true;
		}, 'collect directories')
		.check();
	return Array.from(dirs);
}

/**
 * Check if a string follows kebab-case naming convention
 */
export function isKebabCase(str: string): boolean {
	return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(str);
}
