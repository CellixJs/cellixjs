import net from 'node:net';
import { getMongoPort } from '../../build-pipeline/scripts/worktree-ports.mjs';

const MONGO_PORT = getMongoPort();

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

if (await isPortListening(MONGO_PORT)) {
	console.log(`[mongo-mock] already running on port ${MONGO_PORT}, skipping`);
	process.exit(0);
}

// Not running — start it via tsx with the worktree-scoped port
const {
	default: { spawn },
} = await import('node:child_process');
const child = spawn('tsx', ['src/index.ts'], {
	stdio: 'inherit',
	env: { ...process.env, PORT: String(MONGO_PORT) },
});
child.on('exit', (code) => {
	process.exit(code ?? 1);
});
