/**
 * JSON-compatible settings object accepted by worktree transformers.
 */
export type SettingsRecord = Record<string, unknown>;

/**
 * Settings keys with special generic worktree behavior.
 */
export type KnownWorktreeSettings = SettingsRecord & {
	/** Numeric port string offset when a worktree is active. */
	PORT?: unknown;
	/** Azurite storage key used to build connection strings. */
	STORAGE_ACCOUNT_KEY?: unknown;
	/** Azurite storage account used to build connection strings. */
	STORAGE_ACCOUNT_NAME?: unknown;
};

/**
 * Environment shape used by worktree helpers.
 */
export type WorktreeEnv = NodeJS.ProcessEnv & {
	/** Raw worktree name used for hostname suffixes and port offsets. */
	WORKTREE_NAME?: string;
};

/**
 * Explicit worktree transform mode.
 *
 * `true` enables transforms when a name is available, and `false` disables
 * transforms even if `WORKTREE_NAME` is present in the environment.
 */
export type WorktreeMode = boolean;

/**
 * Options shared by worktree env and settings transformers.
 */
export interface WorktreeSettingsOptions {
	/** Base environment. Defaults to `process.env`. */
	env?: NodeJS.ProcessEnv;
	/** Settings to merge over `env` before worktree transforms are applied. */
	settings?: SettingsRecord;
	/** Whether to apply worktree transforms. Defaults to auto-detection from `WORKTREE_NAME`. */
	worktree?: WorktreeMode;
	/** Worktree name. Defaults to `env.WORKTREE_NAME`. */
	worktreeName?: string;
}
