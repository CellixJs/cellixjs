import { type ChildProcess, spawn } from 'node:child_process';
import { join } from 'node:path';
import type { TestServer } from '@ocom-verification/verification-shared/servers';
import { getTimeout } from '@ocom-verification/verification-shared/settings';
import { appPaths } from './app-paths.ts';
import { spawnEnv } from './child-process-env.ts';

interface PortReadyModule {
	isPortListening(port: number): Promise<boolean>;
	waitForPort(port: number, options?: { timeoutMs?: number; intervalMs?: number }): Promise<boolean>;
}

interface WorktreePortsModule {
	getAzuritePorts(): { blob: number; queue: number; table: number };
}

const portReadyModuleUrl = new URL('../../../../../../../scripts/local-dev/port-ready.mjs', import.meta.url).href;
const worktreePortsModuleUrl = new URL('../../../../../../../scripts/local-dev/worktree-ports.mjs', import.meta.url).href;

const { isPortListening, waitForPort } = (await import(portReadyModuleUrl)) as PortReadyModule;
const { getAzuritePorts } = (await import(worktreePortsModuleUrl)) as WorktreePortsModule;

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

		const binDir = join(appPaths.apiDir, 'node_modules', '.bin');

		this.process = spawn('node', ['start-azurite.mjs'], {
			cwd: appPaths.apiDir,
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
		const ready = await waitForPort(this.blobPort, {
			timeoutMs: getTimeout('serverStartup'),
			intervalMs: getTimeout('healthProbeInterval'),
		});
		if (!ready) {
			throw new Error(`TestAzuriteServer: blob port ${this.blobPort} did not start within timeout`);
		}
	}
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
