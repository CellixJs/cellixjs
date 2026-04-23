import { type ChildProcess, spawn } from 'node:child_process';
import { getPortlessPath } from './resolve-portless.ts';

/**
 * Abstract base class for portless-proxied servers.
 * Subclasses define the hostname, command, ready marker, and working directory.
 * The base class handles spawning via portless, readiness detection, and shutdown.
 */
export abstract class PortlessServer {
	private process: ChildProcess | null = null;
	private startedByUs = false;

	protected abstract get probeUrl(): string;
	protected abstract get readyMarker(): string;
	protected abstract get serverName(): string;
	protected abstract get startupTimeoutMs(): number;
	protected abstract get spawnArgs(): string[];
	protected abstract get cwd(): string;
	protected get extraEnv(): Record<string, string> {
		return {};
	}

	async isAlreadyRunning(): Promise<boolean> {
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 3_000);
			const res = await fetch(this.probeUrl, { signal: controller.signal });
			clearTimeout(timeout);
			return res.ok;
		} catch {
			return false;
		}
	}

	async start(): Promise<void> {
		if (this.process || this.startedByUs) return;
		if (await this.isAlreadyRunning()) return;

		const env = {
			...process.env,
			...this.extraEnv,
		};
		// Remove NODE_OPTIONS from child process to avoid tsx import issues
		delete env.NODE_OPTIONS;

		this.process = spawn(getPortlessPath(), this.spawnArgs, {
			cwd: this.cwd,
			env,
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

		proc.kill('SIGTERM');

		await new Promise<void>((resolve) => {
			const timeout = setTimeout(() => {
				proc.kill('SIGKILL');
				resolve();
			}, 10_000);

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

			const timeout = setTimeout(() => {
				reject(new Error(`${this.serverName} did not start within ${this.startupTimeoutMs}ms`));
			}, this.startupTimeoutMs);

			let stderrOutput = '';

			proc.stdout?.on('data', (data: Buffer) => {
				if (data.toString().includes(this.readyMarker)) {
					clearTimeout(timeout);
					resolve();
				}
			});

			proc.stderr?.on('data', (data: Buffer) => {
				stderrOutput += data.toString();
			});

			proc.on('error', (err) => {
				clearTimeout(timeout);
				this.process = null;
				this.startedByUs = false;
				reject(new Error(`${this.serverName} failed to start: ${err.message}`));
			});

			proc.on('exit', (code) => {
				clearTimeout(timeout);
				this.process = null;
				this.startedByUs = false;
				reject(new Error(`${this.serverName} exited unexpectedly (code: ${code}). stderr: ${stderrOutput.slice(-2000)}`));
			});
		});
	}
}
