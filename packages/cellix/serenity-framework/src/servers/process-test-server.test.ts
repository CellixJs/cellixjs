import { afterEach, describe, expect, it, vi } from 'vitest';

const childProcessMock = vi.hoisted(() => ({
	execFileSync: vi.fn(),
}));

vi.mock('node:child_process', async (importOriginal) => {
	const actual = await importOriginal<typeof import('node:child_process')>();
	return {
		...actual,
		execFileSync: childProcessMock.execFileSync,
	};
});

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
		childProcessMock.execFileSync.mockReset();
		vi.unstubAllGlobals();
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

	it('closes configured ports before checking whether the server is already running', async () => {
		childProcessMock.execFileSync.mockReturnValue('123\n456\n');
		const kill = vi.spyOn(process, 'kill').mockImplementation(() => true);
		const isAlreadyRunning = vi.fn(async () => true);
		const server = new ProcessTestServer({
			serverName: 'fixed-port server',
			executable: process.execPath,
			spawnArgs: ['-e', "console.log('READY')"],
			cwd: process.cwd(),
			readyMarker: 'READY',
			getUrl: () => 'http://unused.test',
			isAlreadyRunning,
			portsToCloseBeforeStart: () => 27_017,
			probe: false,
		});

		await server.start();

		try {
			expect(childProcessMock.execFileSync).toHaveBeenCalledWith('lsof', ['-ti', 'tcp:27017'], {
				encoding: 'utf-8',
				stdio: ['ignore', 'pipe', 'ignore'],
			});
			expect(kill).toHaveBeenCalledWith(123, 'SIGTERM');
			expect(kill).toHaveBeenCalledWith(456, 'SIGTERM');
			expect(childProcessMock.execFileSync.mock.invocationCallOrder[0] ?? 0).toBeLessThan(isAlreadyRunning.mock.invocationCallOrder[0] ?? 0);
		} finally {
			kill.mockRestore();
		}
	});
});
