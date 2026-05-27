import { spawn } from 'node:child_process';
import { isGracefulInterruptExit } from '../../scripts/local-dev/dev-process-exit.mjs';
import { getAzuritePorts } from '../../scripts/local-dev/worktree-ports.mjs';

const ports = getAzuritePorts();
const worktreeName = process.env.WORKTREE_NAME ?? '';
const storageSuffix = worktreeName ? `-${worktreeName}` : '';

const blobDir = `../../__blobstorage__${storageSuffix}`;
const queueDir = `../../__queuestorage__${storageSuffix}`;
const tableDir = `../../__tablestorage__${storageSuffix}`;

const procs = [
	spawn('azurite-blob', ['--silent', '--blobPort', String(ports.blob), '--location', blobDir], { stdio: 'inherit' }),
	spawn('azurite-queue', ['--silent', '--queuePort', String(ports.queue), '--location', queueDir], { stdio: 'inherit' }),
	spawn('azurite-table', ['--silent', '--tablePort', String(ports.table), '--location', tableDir], { stdio: 'inherit' }),
];

console.log(`[azurite] started (blob=${ports.blob}, queue=${ports.queue}, table=${ports.table})`);

let exited = 0;
for (const proc of procs) {
	proc.on('exit', (code, signal) => {
		if (isGracefulInterruptExit(signal, code)) {
			if (++exited === procs.length) process.exit(0);
			return;
		}
		console.error(`[azurite] process exited unexpectedly: code=${code} signal=${signal}`);
		for (const p of procs) p.kill();
		process.exit(code ?? 1);
	});
}
process.on('SIGINT', () => {
	for (const p of procs) p.kill('SIGINT');
});
process.on('SIGTERM', () => {
	for (const p of procs) p.kill('SIGTERM');
});
