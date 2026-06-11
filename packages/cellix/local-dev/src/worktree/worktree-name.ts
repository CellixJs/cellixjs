import type { WorktreeEnv, WorktreeMode } from './types.ts';

function parseWorktreeMode(value: string | undefined): WorktreeMode | undefined {
	if (!value) return undefined;

	const normalized = value.toLowerCase();
	if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
	if (['0', 'false', 'no', 'off'].includes(normalized)) return false;

	return undefined;
}

/**
 * Resolves the effective worktree name for a local-dev operation.
 *
 * `worktree: false` or `CELLIX_WORKTREE=0` disables worktree behavior even
 * when `WORKTREE_NAME` is present. Invalid `CELLIX_WORKTREE` values are ignored
 * so callers can fall back to automatic mode.
 *
 * @param options - Optional env, explicit mode, and explicit worktree name.
 * @returns The worktree name to apply, or `undefined` when transforms should be
 * disabled or no name is available.
 */
export function resolveWorktreeName(options: { env?: NodeJS.ProcessEnv; worktree?: WorktreeMode; worktreeName?: string }): string | undefined {
	const env = (options.env ?? process.env) as WorktreeEnv;
	const worktreeMode = options.worktree ?? parseWorktreeMode(env.CELLIX_WORKTREE);

	if (worktreeMode === false) return undefined;

	return options.worktreeName ?? env.WORKTREE_NAME;
}
