import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(currentDir, '../../../../../..');

let resolvedPath: string | undefined;

export function getPortlessPath(): string {
	if (!resolvedPath) {
		const localBin = resolve(workspaceRoot, 'node_modules/.bin/portless');
		if (existsSync(localBin)) {
			resolvedPath = localBin;
		} else {
			throw new Error(`Could not find portless binary at ${localBin}. Run 'pnpm install' from the workspace root.`);
		}
	}
	return resolvedPath;
}
