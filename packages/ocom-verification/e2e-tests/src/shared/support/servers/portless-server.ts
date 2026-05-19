import { type ChildProcess, spawn } from 'node:child_process';
import type { TestServer } from '@ocom-verification/verification-shared/servers';
import { getTimeout } from '@ocom-verification/verification-shared/settings';
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
	private readonly useDetachedProcessGroup = process.platform !== 'win32';

	protected abstract get probeUrl(): string;
	protected abstract get readyMarker(): string;
	protected abstract get serverName(): string;
	protected abstract get spawnArgs(): string[];
	protected abstract get cwd(): string;

	protected get executable(): string {
		return getPortlessPath();
	}

	protected get probeRequestInit(): RequestInit {
		return {};
	}

	protected get extraEnv(): Record<string, string> {
		return {};
	}

	protected isProbeHealthy(response: Response): boolean | Promise<boolean> {
		return response.ok;
	}

	protected get startupTimeoutMs(): number {
		return getTimeout('serverStartup');
	}

	abstract getUrl(): string;

	/**
	 * Check if server is already running (via health probe).
	 */
	async isAlreadyRunning(): Promise<boolean> {
		try {
			const controller = new AbortController();
			const probeTimeout = getTimeout('healthProbe');
			const timeout = setTimeout(() => controller.abort(), probeTimeout);
			const res = await fetch(this.probeUrl, { ...this.probeRequestInit, signal: controller.signal });
			clearTimeout(timeout);
			return await this.isProbeHealthy(res);
		} catch {
			return false;
		}
	}

	/**
	 * Start the server subprocess and wait for it to be ready.
	 */
	async start(): Promise<void> {
		if (this.process || this.startedByUs) return;
		if (await this.isAlreadyRunning()) return;

		const env = {
			...process.env,
			...this.extraEnv,
		};
		// Remove NODE_OPTIONS from child process to avoid tsx import issues
		delete env['NODE_OPTIONS'];

		this.process = spawn(this.executable, this.spawnArgs, {
			cwd: this.cwd,
			env,
			detached: this.useDetachedProcessGroup,
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

		// SIGINT lets portless run its cleanup branch — deregister the hostname from
		// ~/.portless/routes.json before exiting. Fall back to SIGKILL after the
		// shutdown timeout for anything that ignores SIGINT.
		this.killProcess(proc, 'SIGINT');

		const shutdownTimeout = getTimeout('serverShutdown');
		await new Promise<void>((resolve) => {
			const timeout = setTimeout(() => {
				this.killProcess(proc, 'SIGKILL');
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

			const resolveWhenReachable = () => {
				if (ready) return;
				ready = true;

				this.waitForProbeReady()
					.then(() => {
						clearTimeout(timeout);
						resolve();
					})
					.catch((error: unknown) => {
						clearTimeout(timeout);
						reject(error);
					});
			};

			// stdout listener detects the readyMarker then waits for the probe to respond
			proc.stdout?.on('data', (data: Buffer) => {
				const text = data.toString();
				if (text.includes(this.readyMarker)) {
					resolveWhenReachable();
				}
			});

			proc.stderr?.on('data', (data: Buffer) => {
				stderrOutput += data.toString();
			});

			proc.on('error', (err: Error) => {
				clearTimeout(timeout);
				reject(new Error(`${this.serverName} failed to start: ${err.message}`));
			});

			proc.on('exit', (code, signal) => {
				clearTimeout(timeout);
				this.process = null;
				this.startedByUs = false;
				reject(new Error(`${this.serverName} exited unexpectedly (code: ${code}, signal: ${signal}). stderr: ${stderrOutput.slice(-2000)}`));
			});
		});
	}

	private async waitForProbeReady(): Promise<void> {
		const probeInterval = getTimeout('healthProbeInterval');
		while (!(await this.isAlreadyRunning())) {
			await new Promise((resolve) => setTimeout(resolve, probeInterval));
		}
	}

	private killProcess(proc: ChildProcess, signal: NodeJS.Signals): void {
		if (this.useDetachedProcessGroup && proc.pid) {
			try {
				process.kill(-proc.pid, signal);
				return;
			} catch {
				/* Fall back to killing the direct child below. */
			}
		}
		proc.kill(signal);
	}
}
