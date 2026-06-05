import path from 'node:path';
import { getAzuritePorts, resolveWorkspaceRoot, runAzuriteDev } from '@cellix/local-dev';

const workspaceRoot = resolveWorkspaceRoot();
const worktreeName = process.env['WORKTREE_NAME'];
const ports = getAzuritePorts(worktreeName);
const storageSuffix = worktreeName ? `-${worktreeName}` : '';

runAzuriteDev({
	blobPort: ports.blob,
	blobLocation: path.join(workspaceRoot, `__blobstorage__${storageSuffix}`),
	queuePort: ports.queue,
	queueLocation: path.join(workspaceRoot, `__queuestorage__${storageSuffix}`),
	tablePort: ports.table,
	tableLocation: path.join(workspaceRoot, `__tablestorage__${storageSuffix}`),
});
