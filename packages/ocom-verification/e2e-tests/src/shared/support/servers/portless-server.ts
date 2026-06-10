import { type ChildProcess, spawn } from 'node:child_process';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TestServer } from '@ocom-verification/verification-shared/servers';
import { getTimeout } from '@ocom-verification/verification-shared/settings';
import { spawnEnv } from './child-process-env.ts';
import { getPortlessPath } from './resolve-portless.ts';

const harnessTargetDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../target');

/**
 * Abstract base class for portless-proxied servers.
 * Subclasses define the hostname, command, ready marker, probe URL, and working directory.
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

	protected get startupTimeoutMs(): number {
		return getTimeout('serverStartup');
	}

	protected isProbeHealthy(response: Response): boolean | Promise<boolean> {
		return response.ok;
	}

	protected get waitForProbeAfterReadyMarker(): boolean {
		return true;
	}

	protected get logFilePath(): string {
		return resolve(harnessTargetDir, 'e2e-server-logs', `${this.serverName}.log`);
	}

	/**
	 * Check if server is already running (via health probe).
	 * Uses centralized health probe timeout.
	 */
	isAlreadyRunning(): Promise<boolean> {
		return this.isProbeReadyWithin(getTimeout('healthProbe'));
	}

	abstract getUrl(): string;

	async start(): Promise<void> {
		if (this.process || this.startedByUs) return;
		if (await this.isAlreadyRunning()) return;

		this.process = spawn(this.executable, this.spawnArgs, {
			cwd: this.cwd,
			env: spawnEnv(this.extraEnv),
			detached: this.useDetachedProcessGroup,
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		this.startedByUs = true;
		mkdirSync(dirname(this.logFilePath), { recursive: true });
		writeFileSync(this.logFilePath, '', 'utf8');
		this.appendToLogFile(`[${new Date().toISOString()}] starting ${this.serverName}\n`);

		await this.waitForReady();
	}

	async stop(): Promise<void> {
		if (!this.process || !this.startedByUs) return;

		const proc = this.process;
		this.process = null;
		this.startedByUs = false;

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
			const startupDeadline = Date.now() + startupTimeout;
			const timeout = setTimeout(() => {
				reject(new Error(`${this.serverName} did not start within ${startupTimeout}ms`));
			}, startupTimeout);

			let stderrOutput = '';
			let ready = false;

			const resolveWhenReachable = () => {
				if (ready) {
					return;
				}
				ready = true;

				if (!this.waitForProbeAfterReadyMarker) {
					clearTimeout(timeout);
					resolve();
					return;
				}

				this.waitForProbeReady(startupDeadline, startupTimeout)
					.then(() => {
						clearTimeout(timeout);
						resolve();
					})
					.catch((error: unknown) => {
						clearTimeout(timeout);
						reject(error);
					});
			};

			proc.stdout?.on('data', (data: Buffer) => {
				const text = data.toString();
				this.appendToLogFile(text);
				if (text.includes(this.readyMarker)) {
					resolveWhenReachable();
				}
			});

			proc.stderr?.on('data', (data: Buffer) => {
				const text = data.toString();
				stderrOutput += text;
				this.appendToLogFile(text);
			});

			proc.on('error', (err: Error) => {
				clearTimeout(timeout);
				this.process = null;
				this.startedByUs = false;
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

	private appendToLogFile(content: string): void {
		const logFile = this.logFilePath;
		mkdirSync(dirname(logFile), { recursive: true });
		appendFileSync(logFile, content);
	}

	private async waitForProbeReady(startupDeadline: number, startupTimeout: number): Promise<void> {
		const probeInterval = getTimeout('healthProbeInterval');
		const timeoutError = () => new Error(`${this.serverName} did not become healthy within ${startupTimeout}ms`);

		while (true) {
			const remainingMs = startupDeadline - Date.now();
			if (remainingMs <= 0) {
				throw timeoutError();
			}

			if (await this.isProbeReadyWithin(Math.min(getTimeout('healthProbe'), remainingMs))) {
				return;
			}

			const retryDelay = Math.min(probeInterval, startupDeadline - Date.now());
			if (retryDelay <= 0) {
				throw timeoutError();
			}

			await new Promise((resolve) => setTimeout(resolve, retryDelay));
		}
	}

	private async isProbeReadyWithin(timeoutMs: number): Promise<boolean> {
		let timeout: ReturnType<typeof setTimeout> | undefined;
		try {
			const controller = new AbortController();
			timeout = setTimeout(() => controller.abort(), timeoutMs);
			const response = await fetch(this.probeUrl, { ...this.probeRequestInit, signal: controller.signal });
			return await this.isProbeHealthy(response);
		} catch {
			return false;
		} finally {
			if (timeout) clearTimeout(timeout);
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
