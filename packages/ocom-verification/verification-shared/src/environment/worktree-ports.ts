/** Internal test-service ports used by a single verification worktree. */
export interface AzuritePorts {
	/** Azurite blob service port. */
	blob: number;
	/** Azurite queue service port. */
	queue: number;
	/** Azurite table service port. */
	table: number;
}

/**
 * Resolve the deterministic local-service port offset for the current worktree.
 *
 * When `WORKTREE_NAME` is absent, verification suites use the default local
 * ports. When it is present, each worktree name maps to a stable offset so
 * MongoDB and Azurite test servers can run beside another worktree.
 */
export function getWorktreePortOffset(): number {
	const { WORKTREE_NAME: name } = process.env;
	if (!name) return 0;
	let hash = 0;
	for (const c of name) hash = ((hash << 5) - hash + c.charCodeAt(0)) | 0;
	return ((Math.abs(hash) % 49) + 1) * 100;
}

/** MongoDB memory-server port for the current verification worktree. */
export function getMongoPort(): number {
	return 50_000 + getWorktreePortOffset();
}

/** Azurite service ports for the current verification worktree. */
export function getAzuritePorts(): AzuritePorts {
	const offset = getWorktreePortOffset();
	return {
		blob: 10_000 + offset,
		queue: 10_001 + offset,
		table: 10_002 + offset,
	};
}
