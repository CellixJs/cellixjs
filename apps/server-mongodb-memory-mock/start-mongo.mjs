import { isPortListening } from '../../scripts/local-dev/port-ready.mjs';
import { getMongoPort } from '../../scripts/local-dev/worktree-ports.mjs';

const MONGO_PORT = getMongoPort();

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
