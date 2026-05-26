import { spawn } from 'node:child_process';
import { isGracefulInterruptExit } from '../../scripts/local-dev/dev-process-exit.mjs';
import { isPortListening, waitForPort } from '../../scripts/local-dev/port-ready.mjs';
import { getAzuritePorts } from '../../scripts/local-dev/worktree-ports.mjs';

const ports = getAzuritePorts();
const worktreeName = process.env.WORKTREE_NAME ?? '';
const storageSuffix = worktreeName ? `-${worktreeName}` : '';

if (await isPortListening(ports.blob)) {
	console.log(`[azurite] ready (blob port ${ports.blob})`);
	process.exit(0);
}

const blobDir = `../../__blobstorage__${storageSuffix}`;
const queueDir = `../../__queuestorage__${storageSuffix}`;
const tableDir = `../../__tablestorage__${storageSuffix}`;

const procs = [
	spawn('azurite-blob', ['--silent', '--blobPort', String(ports.blob), '--location', blobDir], { stdio: 'inherit' }),
	spawn('azurite-queue', ['--silent', '--queuePort', String(ports.queue), '--location', queueDir], { stdio: 'inherit' }),
	spawn('azurite-table', ['--silent', '--tablePort', String(ports.table), '--location', tableDir], { stdio: 'inherit' }),
];

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

if (await waitForPort(ports.blob, { timeoutMs: 30_000 })) {
	console.log(`[azurite] ready (blob port ${ports.blob})`);
} else {
	console.error(`[azurite] blob port ${ports.blob} did not become ready within 30000ms`);
	for (const p of procs) p.kill();
	process.exit(1);
}

process.on('SIGINT', () => {
	for (const p of procs) p.kill('SIGINT');
});
process.on('SIGTERM', () => {
	for (const p of procs) p.kill('SIGTERM');
});
