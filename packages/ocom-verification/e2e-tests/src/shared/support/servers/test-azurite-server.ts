import { type ChildProcess, spawn } from 'node:child_process';
import net from 'node:net';
import { join } from 'node:path';
import type { TestServer } from '@ocom-verification/verification-shared/servers';
import { apiSettings, getTimeout } from '@ocom-verification/verification-shared/settings';
import { getAzuritePorts } from '../../../../../../../build-pipeline/scripts/worktree-ports.mjs';
import { spawnEnv } from './e2e-defaults.ts';

/**
 * Starts Azurite via apps/api/start-azurite.mjs. The script itself short-circuits
 * if the blob port is already listening, so concurrent worktrees and re-runs are
 * safe. We track the spawned process only when we started it ourselves.
 */
export class TestAzuriteServer implements TestServer {
	private process: ChildProcess | null = null;
	private startedByUs = false;
	private readonly useDetachedProcessGroup = process.platform !== 'win32';

	private get blobPort(): number {
		return getAzuritePorts().blob;
	}

	async start(): Promise<void> {
		if (this.process || this.startedByUs) return;
		if (await isPortListening(this.blobPort)) return;

		const binDir = join(apiSettings.apiDir, 'node_modules', '.bin');

		this.process = spawn('node', ['start-azurite.mjs'], {
			cwd: apiSettings.apiDir,
			env: spawnEnv({ PATH: `${binDir}:${process.env['PATH'] ?? ''}` }),
			detached: this.useDetachedProcessGroup,
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		this.startedByUs = true;

		await this.waitForReady();
	}

	async stop(): Promise<void> {
		if (!this.process || !this.startedByUs) return;

		const proc = this.process;
		this.process = null;
		this.startedByUs = false;

		killProcess(proc, 'SIGTERM', this.useDetachedProcessGroup);

		await new Promise<void>((resolve) => {
			const timeout = setTimeout(() => {
				killProcess(proc, 'SIGKILL', this.useDetachedProcessGroup);
				resolve();
			}, getTimeout('serverShutdown'));

			proc.on('exit', () => {
				clearTimeout(timeout);
				resolve();
			});
		});
	}

	isRunning(): boolean {
		return this.process !== null;
	}

	getUrl(): string {
		return `http://127.0.0.1:${this.blobPort}`;
	}

	private async waitForReady(): Promise<void> {
		const deadline = Date.now() + getTimeout('serverStartup');
		const interval = getTimeout('healthProbeInterval');
		while (Date.now() < deadline) {
			if (await isPortListening(this.blobPort)) return;
			await new Promise((resolve) => setTimeout(resolve, interval));
		}
		throw new Error(`TestAzuriteServer: blob port ${this.blobPort} did not start within timeout`);
	}
}

function isPortListening(port: number): Promise<boolean> {
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

function killProcess(proc: ChildProcess, signal: NodeJS.Signals, useGroup: boolean): void {
	if (useGroup && proc.pid) {
		try {
			process.kill(-proc.pid, signal);
			return;
		} catch {
			/* Fall back to killing the direct child. */
		}
	}
	proc.kill(signal);
}
