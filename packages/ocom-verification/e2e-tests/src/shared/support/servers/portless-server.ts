import { type ChildProcess, spawn } from 'node:child_process';

/**
 * Abstract base class for subprocess-backed test servers.
 * Subclasses invoke an app package's own local script directly.
 */
export abstract class PortlessServer {
	private process: ChildProcess | null = null;
	private startedByUs = false;
	private readonly useDetachedProcessGroup = process.platform !== 'win32';

	protected abstract get probeUrl(): string;
	protected abstract get readyMarker(): string;
	protected abstract get serverName(): string;
	protected abstract get startupTimeoutMs(): number;
	protected abstract get cwd(): string;
	protected abstract get spawnArgs(): string[];
	protected get executable(): string {
		return 'pnpm';
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

	async isAlreadyRunning(): Promise<boolean> {
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 3_000);
			const res = await fetch(this.probeUrl, { ...this.probeRequestInit, signal: controller.signal });
			clearTimeout(timeout);
			return await this.isProbeHealthy(res);
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

	async stop(): Promise<void> {
		if (!this.process || !this.startedByUs) return;

		const proc = this.process;
		this.process = null;
		this.startedByUs = false;

		this.killProcess(proc, 'SIGTERM');

		await new Promise<void>((resolve) => {
			const timeout = setTimeout(() => {
				this.killProcess(proc, 'SIGKILL');
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
			let ready = false;

			const resolveWhenReachable = () => {
				if (ready) {
					return;
				}
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

			proc.stdout?.on('data', (data: Buffer) => {
				if (data.toString().includes(this.readyMarker)) {
					resolveWhenReachable();
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

	private async waitForProbeReady(): Promise<void> {
		while (!(await this.isAlreadyRunning())) {
			await new Promise((resolve) => setTimeout(resolve, 500));
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
