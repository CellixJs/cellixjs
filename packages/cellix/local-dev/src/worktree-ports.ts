export interface AzuritePorts {
	blob: number;
	queue: number;
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
 */
export function getMongoPort(worktreeName = getDefaultWorktreeName()): number {
	return 50000 + getWorktreePortOffset(worktreeName);
}

/**
 * Returns the Azurite ports for the current worktree.
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
