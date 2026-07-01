import { existsSync } from 'node:fs';
import path from 'node:path';

export interface ResolveWorkspaceRootOptions {
	startDir?: string;
}

/**
 * Finds the Cellix workspace root by walking upward until `pnpm-workspace.yaml`
 * is present.
 */
export function resolveWorkspaceRoot(options: ResolveWorkspaceRootOptions = {}): string {
	let currentDir = path.resolve(options.startDir ?? process.cwd());

	for (;;) {
		if (existsSync(path.join(currentDir, 'pnpm-workspace.yaml'))) {
			return currentDir;
		}

		const parentDir = path.dirname(currentDir);
		if (parentDir === currentDir) {
			throw new Error(`[local-dev] Could not find pnpm-workspace.yaml above ${options.startDir ?? process.cwd()}`);
		}
		currentDir = parentDir;
	}
}
