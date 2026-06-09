import { type ChildProcess, execFileSync, spawn } from 'node:child_process';
import { createSpawnEnvironment } from './process-environment.ts';
import type { TestServer, UiTestServer } from './test-server.ts';

/** Configuration for health probes used by {@link ProcessTestServer}. */
export interface ProcessHealthProbe {
	/** URL to probe after the ready marker is observed. */
	url: string | (() => string);

	/** Request options supplied to `fetch`. */
	requestInit?: RequestInit | (() => RequestInit);

	/** Predicate that decides whether the probe response is healthy. Defaults to `response.ok`. */
	isHealthy?: (response: Response) => boolean | Promise<boolean>;
}

/** Options used by {@link ProcessTestServer}. */
export interface ProcessTestServerOptions {
	/** Human-readable name used in error messages. */
	serverName: string;

	/** Executable to spawn. */
	executable: string | (() => string);

	/** Arguments supplied to the executable. */
	spawnArgs: string[] | (() => string[]);

	/** Working directory for the process. */
	cwd: string;

	/** Marker expected on stdout before health probing begins. */
	readyMarker: string | RegExp;

	/** URL exposed by the server. */
	getUrl: () => string;

	/** Additional process environment values. */
	extraEnv?: Record<string, string> | (() => Record<string, string>);

	/** Health probe configuration. Defaults to probing `getUrl()`. Use `false` to trust the ready marker. */
	probe?: ProcessHealthProbe | false;

	/** Maximum startup time in milliseconds. */
	startupTimeoutMs?: number | (() => number);

	/** Maximum graceful shutdown time in milliseconds. */
	shutdownTimeoutMs?: number | (() => number);

	/** Individual health probe timeout in milliseconds. */
	healthProbeTimeoutMs?: number | (() => number);

	/** Delay between health probes in milliseconds. */
	healthProbeIntervalMs?: number | (() => number);

	/** Return true when the server is already reachable before spawning. */
	isAlreadyRunning?: () => Promise<boolean>;

	/** Ports to clear before spawning, useful for fixed-port local dependencies. */
	portsToCloseBeforeStart?: number | number[] | (() => number | number[]);

	/** Treat an early process exit as an existing reusable server. */
	isReusableExit?: (stderrOutput: string) => boolean;
}

/**
 * Configurable child-process test server.
 *
 * Consumers pass app-specific commands, paths, URLs, and probes through the
 * descriptor. The framework owns lifecycle, readiness, probing, and shutdown.
 */
export class ProcessTestServer implements TestServer {
	private process: ChildProcess | null = null;
	private startedByUs = false;
	private readonly useDetachedProcessGroup = process.platform !== 'win32';

	/**
	 * @param options Process descriptor and lifecycle settings.
	 */
	constructor(private readonly options: ProcessTestServerOptions) {}

	/**
	 * Start the process and wait for readiness.
	 */
	async start(): Promise<void> {
		if (this.process || this.startedByUs) {
			return;
		}

		this.closePortsBeforeStart();

		if (await this.isAlreadyRunning()) {
			return;
		}

		const executable = this.value(this.options.executable);
		const spawnArgs = this.value(this.options.spawnArgs);
		if (!executable || !spawnArgs) {
			throw new Error(`${this.options.serverName} requires an executable and spawn arguments`);
		}

		this.process = spawn(executable, spawnArgs, {
			cwd: this.options.cwd,
			env: createSpawnEnvironment(this.value(this.options.extraEnv) ?? {}),
			detached: this.useDetachedProcessGroup,
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		this.startedByUs = true;

		try {
			await this.waitForReady();
		} catch (error) {
			await this.stop().catch(() => undefined);
			throw error;
		}
	}

	/**
	 * Stop a process started by this instance.
	 */
	async stop(): Promise<void> {
		if (!this.process || !this.startedByUs) {
			return;
		}

		const childProcess = this.process;
		this.process = null;
		this.startedByUs = false;

		this.killProcess(childProcess, 'SIGINT');

		await new Promise<void>((resolve) => {
			const timeout = setTimeout(() => {
				this.killProcess(childProcess, 'SIGKILL');
				resolve();
			}, this.value(this.options.shutdownTimeoutMs) ?? 10_000);

			childProcess.on('exit', () => {
				clearTimeout(timeout);
				resolve();
			});
		});
	}

	/**
	 * Return whether this instance currently owns a running child process.
	 */
	isRunning(): boolean {
		return this.process !== null;
	}

	/**
	 * Return the descriptor URL.
	 */
	getUrl(): string {
		return this.options.getUrl();
	}

	private async isAlreadyRunning(): Promise<boolean> {
		if (this.options.isAlreadyRunning) {
			return await this.options.isAlreadyRunning();
		}
		if (this.options.probe === false) {
			return false;
		}
		return await this.isProbeReadyWithin(this.value(this.options.healthProbeTimeoutMs) ?? 3_000);
	}

	private waitForReady(): Promise<void> {
		return new Promise((resolve, reject) => {
			const childProcess = this.process;
			if (!childProcess) {
				reject(new Error(`${this.options.serverName} process not started`));
				return;
			}

			const startupTimeout = this.value(this.options.startupTimeoutMs) ?? 120_000;
			const startupDeadline = Date.now() + startupTimeout;
			const timeout = setTimeout(() => {
				reject(new Error(`${this.options.serverName} did not start within ${startupTimeout}ms`));
			}, startupTimeout);

			let stderrOutput = '';
			let ready = false;

			const resolveWhenReachable = () => {
				if (ready) {
					return;
				}
				ready = true;

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

			childProcess.stdout?.on('data', (data: Buffer) => {
				const text = data.toString();
				if (this.matchesReadyMarker(text)) {
					resolveWhenReachable();
				}
			});

			childProcess.stderr?.on('data', (data: Buffer) => {
				stderrOutput += data.toString();
			});

			childProcess.on('error', (error: Error) => {
				clearTimeout(timeout);
				this.process = null;
				this.startedByUs = false;
				reject(new Error(`${this.options.serverName} failed to start: ${error.message}`));
			});

			childProcess.on('exit', (code, signal) => {
				if (this.process === childProcess) {
					this.process = null;
					this.startedByUs = false;
				}
				if (ready) {
					return;
				}
				clearTimeout(timeout);

				if (this.options.isReusableExit?.(stderrOutput)) {
					this.waitForProbeReady(startupDeadline, startupTimeout)
						.then(() => {
							resolve();
						})
						.catch((error: unknown) => {
							reject(error);
						});
					return;
				}

				reject(new Error(`${this.options.serverName} exited unexpectedly (code: ${code}, signal: ${signal}). stderr: ${stderrOutput.slice(-2000)}`));
			});
		});
	}

	private async waitForProbeReady(startupDeadline: number, startupTimeout: number): Promise<void> {
		const probeInterval = this.value(this.options.healthProbeIntervalMs) ?? 500;
		const timeoutError = () => new Error(`${this.options.serverName} did not become healthy within ${startupTimeout}ms`);

		while (true) {
			const remainingMs = startupDeadline - Date.now();
			if (remainingMs <= 0) {
				throw timeoutError();
			}

			if (await this.isProbeReadyWithin(Math.min(this.value(this.options.healthProbeTimeoutMs) ?? 3_000, remainingMs))) {
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
		if (this.options.probe === false) {
			return true;
		}

		let timeout: ReturnType<typeof setTimeout> | undefined;
		try {
			const controller = new AbortController();
			timeout = setTimeout(() => controller.abort(), timeoutMs);
			const probe = this.options.probe;
			const response = await fetch(this.value(probe?.url) ?? this.getUrl(), {
				...(this.value(probe?.requestInit) ?? {}),
				signal: controller.signal,
			});
			return probe?.isHealthy ? await probe.isHealthy(response) : response.ok;
		} catch {
			return false;
		} finally {
			if (timeout) {
				clearTimeout(timeout);
			}
		}
	}

	private matchesReadyMarker(text: string): boolean {
		const marker = this.options.readyMarker;
		return typeof marker === 'string' ? text.includes(marker) : marker.test(text);
	}

	private killProcess(childProcess: ChildProcess, signal: NodeJS.Signals): void {
		if (this.useDetachedProcessGroup && childProcess.pid) {
			try {
				process.kill(-childProcess.pid, signal);
				return;
			} catch {
				/* Fall back to killing the direct child. */
			}
		}

		childProcess.kill(signal);
	}

	private closePortsBeforeStart(): void {
		const ports = this.value(this.options.portsToCloseBeforeStart);
		for (const port of Array.isArray(ports) ? ports : ports === undefined ? [] : [ports]) {
			this.closeProcessesListeningOnPort(port);
		}
	}

	private closeProcessesListeningOnPort(port: number): void {
		if (process.platform === 'win32') {
			return;
		}

		let output = '';
		try {
			output = execFileSync('lsof', ['-ti', `tcp:${port}`], {
				encoding: 'utf-8',
				stdio: ['ignore', 'pipe', 'ignore'],
			});
		} catch {
			return;
		}

		const pids = output
			.split('\n')
			.map((pid) => Number.parseInt(pid, 10))
			.filter((pid) => Number.isFinite(pid));

		for (const pid of pids) {
			try {
				process.kill(pid, 'SIGTERM');
			} catch {
				/* Process already exited. */
			}
		}
	}

	private value<T>(value: T | (() => T) | undefined): T | undefined {
		return typeof value === 'function' ? (value as () => T)() : value;
	}
}

/**
 * Child-process server for browser UI portals.
 */
export class ProcessUiTestServer extends ProcessTestServer implements UiTestServer {
	readonly uiPortal = true;
}
