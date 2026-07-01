import type { WorktreeEnv, WorktreeMode } from './types.ts';

/**
 * Resolves the effective worktree name for a local-dev operation.
 *
 * A `WORKTREE_NAME` enables worktree behavior automatically. Callers can pass
 * `worktree: false` to disable it explicitly.
 *
 * @param options - Optional env, explicit mode, and explicit worktree name.
 * @returns The worktree name to apply, or `undefined` when transforms should be
 * disabled or no name is available.
 */
export function resolveWorktreeName(options: { env?: NodeJS.ProcessEnv; worktree?: WorktreeMode; worktreeName?: string }): string | undefined {
	const env = (options.env ?? process.env) as WorktreeEnv;
	if (options.worktree === false) return undefined;

	return options.worktreeName ?? env.WORKTREE_NAME;
}
