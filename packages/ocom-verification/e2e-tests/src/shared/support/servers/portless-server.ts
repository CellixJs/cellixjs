import { type ChildProcess, spawn } from 'node:child_process';
import type { TestServer } from '@ocom-verification/verification-shared/servers';
import { getTimeout } from '@ocom-verification/verification-shared/settings';
import { spawnEnv } from './child-process-env.ts';
import { getPortlessPath } from './resolve-portless.ts';

/**
 * Abstract base class for portless-proxied servers.
 * Subclasses define the hostname, command, ready marker, and working directory.
 * The base class handles spawning via portless, readiness detection, and shutdown.
 *
 * This implements the TestServer interface for consistency with
 * GraphQLTestServer (in-process), while providing subprocess isolation
 * for full system tests.
 */
export abstract class PortlessServer implements TestServer {
	private process: ChildProcess | null = null;
	private startedByUs = false;

	protected abstract get readyMarker(): string;
	protected abstract get serverName(): string;
	protected abstract get spawnArgs(): string[];
	protected abstract get cwd(): string;

	protected get executable(): string {
		return getPortlessPath();
	}

	protected get extraEnv(): Record<string, string> {
		return {};
	}

	protected get startupTimeoutMs(): number {
		return getTimeout('serverStartup');
	}

	abstract getUrl(): string;

	/**
	 * Start the server subprocess and wait for it to be ready.
	 */
	async start(): Promise<void> {
		if (this.process || this.startedByUs) return;

		this.process = spawn(this.executable, this.spawnArgs, {
			cwd: this.cwd,
			env: spawnEnv(this.extraEnv),
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		this.startedByUs = true;

		await this.waitForReady();
	}

	/**
	 * Stop the server gracefully, with fallback to SIGKILL.
	 */
	async stop(): Promise<void> {
		if (!this.process || !this.startedByUs) return;

		const proc = this.process;
		this.process = null;
		this.startedByUs = false;

		proc.kill('SIGINT');

		const shutdownTimeout = getTimeout('serverShutdown');
		await new Promise<void>((resolve) => {
			const timeout = setTimeout(() => {
				proc.kill('SIGKILL');
				resolve();
			}, shutdownTimeout);

			proc.on('exit', () => {
				clearTimeout(timeout);
				resolve();
			});
		});
	}

	isRunning(): boolean {
		return this.process !== null;
	}

	private waitForReady(): Promise<void> {
		return new Promise((resolve, reject) => {
			const proc = this.process;
			if (!proc) {
				reject(new Error(`${this.serverName} process not started`));
				return;
			}

			const startupTimeout = this.startupTimeoutMs;
			const timeout = setTimeout(() => {
				reject(new Error(`${this.serverName} did not start within ${startupTimeout}ms`));
			}, startupTimeout);

			let stderrOutput = '';
			let ready = false;

			proc.stdout?.on('data', (data: Buffer) => {
				const text = data.toString();
				if (!ready && text.includes(this.readyMarker)) {
					ready = true;
					clearTimeout(timeout);
					resolve();
				}
			});

			proc.stderr?.on('data', (data: Buffer) => {
				const text = data.toString();
				stderrOutput += text;
			});

			proc.on('error', (err: Error) => {
				clearTimeout(timeout);
				reject(new Error(`${this.serverName} failed to start: ${err.message}`));
			});

			proc.on('exit', (code, signal) => {
				if (ready) return;
				clearTimeout(timeout);
				this.process = null;
				this.startedByUs = false;
				reject(new Error(`${this.serverName} exited unexpectedly (code: ${code}, signal: ${signal}). stderr: ${stderrOutput.slice(-2000)}`));
			});
		});
	}
}
