import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProcessTestServer } from './index.ts';

async function waitUntil(predicate: () => boolean, timeoutMs = 2_000): Promise<void> {
	const deadline = Date.now() + timeoutMs;
	while (!predicate()) {
		if (Date.now() >= deadline) {
			throw new Error(`Condition not met within ${timeoutMs}ms`);
		}
		await new Promise((resolve) => setTimeout(resolve, 10));
	}
}

describe('ProcessTestServer', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('starts a process and trusts the ready marker when probing is disabled', async () => {
		const server = new ProcessTestServer({
			serverName: 'marker-only server',
			executable: process.execPath,
			spawnArgs: ['-e', "console.log('READY'); setInterval(() => undefined, 1_000)"],
			cwd: process.cwd(),
			readyMarker: 'READY',
			getUrl: () => 'http://unused.test',
			probe: false,
			shutdownTimeoutMs: 500,
		});

		try {
			await server.start();

			expect(server.isRunning()).toBe(true);
		} finally {
			await server.stop();
		}
	});

	it('stops reporting a process as running after it exits', async () => {
		const server = new ProcessTestServer({
			serverName: 'short-lived server',
			executable: process.execPath,
			spawnArgs: ['-e', "console.log('READY'); setTimeout(() => process.exit(0), 20)"],
			cwd: process.cwd(),
			readyMarker: 'READY',
			getUrl: () => 'http://unused.test',
			probe: false,
			shutdownTimeoutMs: 500,
		});

		await server.start();
		await waitUntil(() => !server.isRunning());

		expect(server.isRunning()).toBe(false);
	});

	it('reuses an already-running server when a replacement exits with EADDRINUSE', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('ok', { status: 200 })),
		);

		const server = new ProcessTestServer({
			serverName: 'reusable-existing server',
			executable: process.execPath,
			spawnArgs: ['-e', "console.error('Error: listen EADDRINUSE: address already in use 127.0.0.1:4965'); process.exit(1)"],
			cwd: process.cwd(),
			readyMarker: 'READY',
			getUrl: () => 'http://127.0.0.1:4965',
			isReusableExit: (stderrOutput) => stderrOutput.includes('EADDRINUSE'),
			shutdownTimeoutMs: 500,
		});

		try {
			await server.start();
			expect(server.isRunning()).toBe(false);
		} finally {
			await server.stop();
		}
	});
});
