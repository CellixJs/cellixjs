interface AzuritePorts {
	blob: number;
	queue: number;
	table: number;
}

export function getWorktreePortOffset(): number {
	const name = process.env['WORKTREE_NAME'];
	if (!name) return 0;
	let hash = 0;
	for (const c of name) hash = ((hash << 5) - hash + c.charCodeAt(0)) | 0;
	return ((Math.abs(hash) % 49) + 1) * 100;
}

export function getAzuritePorts(): AzuritePorts {
	const offset = getWorktreePortOffset();
	return {
		blob: 10000 + offset,
		queue: 10001 + offset,
		table: 10002 + offset,
	};
}

export function getMongoPort(): number {
	return 50000 + getWorktreePortOffset();
}
