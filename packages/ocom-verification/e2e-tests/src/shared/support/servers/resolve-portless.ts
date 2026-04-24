import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = fileURLToPath(new URL('.', import.meta.url));

let resolvedPath: string | undefined;

export function getPortlessPath(): string {
	if (!resolvedPath) {
		const workspaceRoot = resolve(currentDir, '../../../../../../..');
		const localBin = resolve(workspaceRoot, 'node_modules/.bin/portless');
		if (existsSync(localBin)) {
			resolvedPath = localBin;
		} else {
			throw new Error(`Could not find portless binary at ${localBin}. Run 'pnpm install' from the workspace root.`);
		}
	}
	return resolvedPath;
}
