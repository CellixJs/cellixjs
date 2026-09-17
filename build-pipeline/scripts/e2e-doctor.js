#!/usr/bin/env node
/**
 * Reports anything left behind by an interrupted e2e run.
 *
 * The e2e harness binds fixed ports so the API can be pointed at known URIs, which
 * means an abandoned mongod, API host or Vite server blocks every later run with an
 * "already in use" or health-timeout failure. This prints what is holding those
 * ports, and the command to stop it, instead of leaving it to be decoded from a
 * stack trace.
 */
import { execFileSync } from 'node:child_process';

const PORTS = [
	{ port: 50800, what: 'MongoDB memory replica set' },
	{ port: 4040, what: 'API host' },
	{ port: 4744, what: 'community UI (Vite)' },
	{ port: 4924, what: 'staff UI (Vite)' },
	{ port: 4928, what: 'mock OAuth2 server' },
];

const listenersOn = (port) => {
	try {
		return execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN'], { stdio: ['ignore', 'pipe', 'ignore'] })
			.toString()
			.split('\n')
			.slice(1)
			.filter(Boolean)
			.map((line) => {
				const [command, pid] = line.split(/\s+/);
				return { command, pid };
			});
	} catch {
		return [];
	}
};

let held = false;
for (const { port, what } of PORTS) {
	const listeners = listenersOn(port);
	if (listeners.length === 0) {
		console.log(`  ok    :${port} free (${what})`);
		continue;
	}
	held = true;
	for (const { command, pid } of listeners) {
		console.log(`  BUSY  :${port} held by ${command} (pid ${pid}) — ${what}`);
	}
}

if (held) {
	console.log('\nStop the processes above with `kill <pid>`, then re-run the e2e suite.');
	process.exitCode = 1;
} else {
	console.log('\nNo leftover e2e processes found.');
}
