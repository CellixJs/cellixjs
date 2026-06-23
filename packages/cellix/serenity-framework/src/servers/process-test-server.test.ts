import { beforeEach, describe, expect, it, vi } from 'vitest';

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
	beforeEach(() => {
		childProcessMock.execFileSync.mockReset();
	});

	it('starts a process and trusts the ready marker for non-HTTP URLs', async () => {
		const server = new ProcessTestServer({
			serverName: 'marker-only server',
			executable: process.execPath,
			spawnArgs: ['-e', "console.log('READY'); setInterval(() => undefined, 1_000)"],
			cwd: process.cwd(),
			readyMarker: 'READY',
			url: 'process://marker-only',
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
			url: 'process://short-lived',
			shutdownTimeoutMs: 500,
		});

		await server.start();
		await waitUntil(() => !server.isRunning());

		expect(server.isRunning()).toBe(false);
	});

	it('closes configured ports before spawning', async () => {
		childProcessMock.execFileSync.mockReturnValue('123\n456\n');
		const kill = vi.spyOn(process, 'kill').mockImplementation(() => true);
		const server = new ProcessTestServer({
			serverName: 'fixed-port server',
			executable: process.execPath,
			spawnArgs: ['-e', "console.log('READY'); setInterval(() => undefined, 1_000)"],
			cwd: process.cwd(),
			readyMarker: 'READY',
			url: 'process://fixed-port',
			portsToCloseBeforeStart: () => 27_017,
			shutdownTimeoutMs: 500,
		});

		try {
			await server.start();

			expect(childProcessMock.execFileSync).toHaveBeenCalledWith('lsof', ['-ti', 'tcp:27017'], {
				encoding: 'utf-8',
				stdio: ['ignore', 'pipe', 'ignore'],
			});
			expect(kill).toHaveBeenCalledWith(123, 'SIGTERM');
			expect(kill).toHaveBeenCalledWith(456, 'SIGTERM');
			expect(server.isRunning()).toBe(true);
		} finally {
			await server.stop();
			kill.mockRestore();
		}
	});

	it('uses a POST typename probe for GraphQL URLs by default', async () => {
		const fetch = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValueOnce(new Response('', { status: 404 }))
			.mockResolvedValueOnce(new Response('', { status: 200 }));
		const server = new ProcessTestServer({
			serverName: 'graphql server',
			executable: process.execPath,
			spawnArgs: ['-e', "console.log('READY'); setInterval(() => undefined, 1_000)"],
			cwd: process.cwd(),
			readyMarker: 'READY',
			url: 'http://127.0.0.1:4000/graphql',
			shutdownTimeoutMs: 500,
		});

		try {
			await server.start();

			expect(fetch).toHaveBeenLastCalledWith('http://127.0.0.1:4000/graphql', {
				body: JSON.stringify({ query: '{ __typename }' }),
				headers: { 'Content-Type': 'application/json' },
				method: 'POST',
				signal: expect.any(AbortSignal) as AbortSignal,
			});
		} finally {
			await server.stop();
			fetch.mockRestore();
		}
	});

	it('trusts the ready marker for localhost root URLs without an HTTP probe', async () => {
		const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 500 }));
		const server = new ProcessTestServer({
			serverName: 'localhost web server',
			executable: process.execPath,
			spawnArgs: ['-e', "console.log('READY'); setInterval(() => undefined, 1_000)"],
			cwd: process.cwd(),
			readyMarker: 'READY',
			url: 'http://127.0.0.1:4000/',
			shutdownTimeoutMs: 500,
		});

		try {
			await server.start();

			expect(server.isRunning()).toBe(true);
			expect(fetch).not.toHaveBeenCalled();
		} finally {
			await server.stop();
			fetch.mockRestore();
		}
	});
});
