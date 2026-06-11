export interface AzuritePorts {
	/** Blob service port. */
	blob: number;
	/** Queue service port. */
	queue: number;
	/** Table service port. */
	table: number;
}

type WorktreeEnv = NodeJS.ProcessEnv & {
	WORKTREE_NAME?: string;
};

function getDefaultWorktreeName(): string | undefined {
	return (process.env as WorktreeEnv).WORKTREE_NAME;
}

/**
 * Returns a deterministic worktree port offset in increments of 100.
 *
 * The default worktree uses offset `0`. Named worktrees use one of 49 buckets
 * from `100` through `4900`, which keeps them away from the default service
 * ports while remaining deterministic for repeat local runs.
 *
 * @param worktreeName - Optional worktree identifier. Defaults to
 * `process.env.WORKTREE_NAME`.
 * @returns Port offset to add to service base ports.
 */
export function getWorktreePortOffset(worktreeName = getDefaultWorktreeName()): number {
	if (!worktreeName) return 0;

	let hash = 0;
	for (const char of worktreeName) {
		hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
	}

	return ((Math.abs(hash) % 49) + 1) * 100;
}

/**
 * Returns the MongoDB port for the current worktree.
 *
 * @param worktreeName - Optional worktree identifier. Defaults to
 * `process.env.WORKTREE_NAME`.
 * @returns MongoDB port derived from base `50000` plus the worktree offset.
 */
export function getMongoPort(worktreeName = getDefaultWorktreeName()): number {
	return 50000 + getWorktreePortOffset(worktreeName);
}

/**
 * Returns the Azurite ports for the current worktree.
 *
 * @param worktreeName - Optional worktree identifier. Defaults to
 * `process.env.WORKTREE_NAME`.
 * @returns Blob, queue, and table ports derived from Azurite's default ports
 * plus the worktree offset.
 */
export function getAzuritePorts(worktreeName = getDefaultWorktreeName()): AzuritePorts {
	const offset = getWorktreePortOffset(worktreeName);

	return {
		blob: 10000 + offset,
		queue: 10001 + offset,
		table: 10002 + offset,
	};
}

/**
 * Builds an Azurite connection string from explicit account credentials and
 * ports supplied by the consumer.
 *
 * @param options - Account credentials and explicit Azurite ports to encode.
 * @returns A connection string for the selected worktree-scoped Azurite ports.
 */
export function buildAzuriteConnectionString(options: { accountName: string; accountKey: string; ports: AzuritePorts; host?: string }): string {
	const host = options.host ?? '127.0.0.1';
	return [
		'DefaultEndpointsProtocol=http',
		`AccountName=${options.accountName}`,
		`AccountKey=${options.accountKey}`,
		`BlobEndpoint=http://${host}:${options.ports.blob}/${options.accountName}`,
		`QueueEndpoint=http://${host}:${options.ports.queue}/${options.accountName}`,
		`TableEndpoint=http://${host}:${options.ports.table}/${options.accountName}`,
	].join(';');
}
