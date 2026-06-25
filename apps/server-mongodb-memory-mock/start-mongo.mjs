import { spawn } from 'node:child_process';
import { forwardChildExit } from '../../scripts/local-dev/dev-process-exit.mjs';
import { getMongoPort } from '../../scripts/local-dev/worktree-ports.mjs';

const MONGO_PORT = getMongoPort();

const child = spawn('tsx', ['src/index.ts'], {
	stdio: 'inherit',
	env: { ...process.env, PORT: String(MONGO_PORT) },
});

forwardChildExit(child);
