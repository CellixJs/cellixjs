import { spawn } from 'node:child_process';
import net from 'node:net';
import { isGracefulInterruptExit } from '../../build-pipeline/scripts/dev-process-exit.mjs';
import { getAzuritePorts } from '../../build-pipeline/scripts/worktree-ports.mjs';

const ports = getAzuritePorts();
const worktreeName = process.env.WORKTREE_NAME ?? '';
const storageSuffix = worktreeName ? `-${worktreeName}` : '';

function isPortListening(port) {
	return new Promise((resolve) => {
		const socket = net.createConnection({ port, host: '127.0.0.1' });
		socket.once('connect', () => {
			socket.destroy();
			resolve(true);
		});
		socket.once('error', () => {
			socket.destroy();
			resolve(false);
		});
	});
}

if (await isPortListening(ports.blob)) {
	console.log(`[azurite] already running (blob port ${ports.blob}), skipping`);
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

process.on('SIGINT', () => {
	for (const p of procs) p.kill('SIGINT');
});
process.on('SIGTERM', () => {
	for (const p of procs) p.kill('SIGTERM');
});
