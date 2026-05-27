import { type ChildProcess, spawn } from 'node:child_process';
import { join } from 'node:path';
import type { TestServer } from '@ocom-verification/verification-shared/servers';
import { getTimeout } from '@ocom-verification/verification-shared/settings';
import { appPaths } from './app-paths.ts';
import { spawnEnv } from './child-process-env.ts';
import { getAzuritePorts } from './worktree-ports.ts';

/**
 * Starts Azurite via apps/api/start-azurite.mjs.
 * If ports are already bound (EADDRINUSE), we treat that as an existing
 * reusable instance for this worktree.
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

		const binDir = join(appPaths.apiDir, 'node_modules', '.bin');
		const { PATH: pathValue = '' } = process.env;

		this.process = spawn('node', ['start-azurite.mjs'], {
			cwd: appPaths.apiDir,
			env: spawnEnv({ PATH: `${binDir}:${pathValue}` }),
			detached: this.useDetachedProcessGroup,
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		this.startedByUs = true;

		await this.waitForStartedMarker();
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

	private waitForStartedMarker(): Promise<void> {
		return new Promise((resolve, reject) => {
			const proc = this.process;
			if (!proc) {
				reject(new Error('TestAzuriteServer process not started'));
				return;
			}

			const timeout = setTimeout(() => {
				reject(new Error(`TestAzuriteServer did not emit start marker within ${getTimeout('serverStartup')}ms`));
			}, getTimeout('serverStartup'));

			let stderrOutput = '';

			proc.stdout?.on('data', (data: Buffer) => {
				if (data.toString().includes('[azurite] started')) {
					clearTimeout(timeout);
					resolve();
				}
			});

			proc.stderr?.on('data', (data: Buffer) => {
				stderrOutput += data.toString();
			});

			proc.on('error', (error: Error) => {
				clearTimeout(timeout);
				reject(new Error(`TestAzuriteServer failed to start: ${error.message}`));
			});

			proc.on('exit', (code, signal) => {
				clearTimeout(timeout);
				if (stderrOutput.includes('EADDRINUSE')) {
					this.process = null;
					this.startedByUs = false;
					resolve();
					return;
				}
				reject(new Error(`TestAzuriteServer exited unexpectedly (code: ${code}, signal: ${signal}). stderr: ${stderrOutput.slice(-2000)}`));
			});
		});
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
