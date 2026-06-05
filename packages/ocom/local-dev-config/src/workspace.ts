import { resolveWorkspaceRoot } from '@cellix/local-dev';

export function getWorkspaceRoot(startDir: string = process.cwd()): string {
	return resolveWorkspaceRoot({ startDir });
}
