import { resolveWorkspaceRoot } from '@cellix/local-dev';

/**
 * Resolves the OCOM workspace root using the shared Cellix workspace lookup.
 *
 * @param startDir - Directory to start searching from. Defaults to the current
 * working directory.
 * @returns Absolute workspace root path.
 */
export function getWorkspaceRoot(startDir: string = process.cwd()): string {
	return resolveWorkspaceRoot({ startDir });
}
