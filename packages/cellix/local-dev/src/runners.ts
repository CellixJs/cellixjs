import { type ChildProcess, spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { forwardChildExit, isGracefulInterruptExit } from './dev-process.ts';
import { buildViteArgs } from './vite.ts';

type RunnerEnv = NodeJS.ProcessEnv & {
	HOST?: string;
	NODE_OPTIONS?: string;
	PORT?: string;
	PORTLESS_CA_PATH?: string;
};

export interface RunnerOptions {
	/** Environment to pass to the spawned process. Defaults to `process.env`. */
	env?: NodeJS.ProcessEnv;
}

export interface TsxRunnerOptions extends RunnerOptions {
	/** TSX entrypoint to execute. Defaults to `src/index.ts`. */
	entry?: string;
}

export interface AzureFunctionsDevOptions extends RunnerOptions {
	/** Functions host port. Defaults to `env.PORT`; required after resolution. */
	port?: string;
	/** Azure Functions script root. Defaults to `deploy/`. */
	scriptRoot?: string;
	/** CORS value passed to the Functions host. Defaults to `*`. */
	cors?: string;
	/** Whether to pass `--typescript`. Defaults to `true`. */
	typescript?: boolean;
}

export interface AzuriteDevOptions extends RunnerOptions {
	/** Blob service port. */
	blobPort: number;
	/** Queue service port. */
	queuePort: number;
	/** Table service port. */
	tablePort: number;
	/** Blob storage working directory. */
	blobLocation: string;
	/** Queue storage working directory. */
	queueLocation: string;
	/** Table storage working directory. */
	tableLocation: string;
	/** Whether Azurite should run quietly. Defaults to `true`. */
	silent?: boolean;
}

function spawnInherited(command: string, args: string[], options: { env?: NodeJS.ProcessEnv } = {}): ChildProcess {
	return spawn(command, args, {
		stdio: 'inherit',
		env: options.env,
	});
}

/**
 * Starts a Vite dev process using the caller-provided environment.
 *
 * @param options - Optional environment overrides. `HOST`, `PORT`, `E2E`, and
 * `E2E_VITE_MODE` are interpreted by `buildViteArgs`.
 * @returns The spawned Vite child process.
 */
export function runViteDev(options: RunnerOptions = {}): ChildProcess {
	const env = (options.env ?? process.env) as RunnerEnv;
	const child = spawnInherited(
		'vite',
		buildViteArgs({
			...(env.HOST ? { host: env.HOST } : {}),
			...(env.PORT ? { port: env.PORT } : {}),
			env,
		}),
		{ env },
	);
	forwardChildExit(child);
	return child;
}

/**
 * Starts the Docusaurus dev server with the shared local-dev defaults.
 *
 * @param options - Optional environment overrides. `PORT` controls the internal
 * Docusaurus listener and defaults to `3001`.
 * @returns The spawned Docusaurus child process.
 */
export function runDocusaurusDev(options: RunnerOptions = {}): ChildProcess {
	const env = (options.env ?? process.env) as RunnerEnv;
	const child = spawnInherited('docusaurus', ['start', '--port', env.PORT ?? '3001', '--host', '127.0.0.1', '--no-open'], { env });
	forwardChildExit(child);
	return child;
}

/**
 * Starts an Azure Functions dev process using caller-supplied runtime
 * configuration and environment variables.
 *
 * @param options - Functions host options plus optional environment overrides.
 * `PORT` must be provided directly or through the environment.
 * @returns The spawned Functions host child process.
 * @throws When no port can be resolved.
 */
export function runAzureFunctionsDev(options: AzureFunctionsDevOptions = {}): ChildProcess {
	const env = (options.env ?? process.env) as RunnerEnv;
	const envPort = options.port ?? env.PORT;

	if (!envPort) {
		throw new Error('[local-dev] PORT environment variable is not set. Start this command through portless.');
	}

	const childEnv: NodeJS.ProcessEnv = {
		...env,
		NODE_EXTRA_CA_CERTS: env.PORTLESS_CA_PATH ?? path.join(os.homedir(), '.portless', 'ca.pem'),
		NODE_OPTIONS: `${env.NODE_OPTIONS ?? ''} --use-system-ca`.trim(),
	};

	const args = ['start'];
	if (options.typescript ?? true) {
		args.push('--typescript');
	}

	args.push('--script-root', options.scriptRoot ?? 'deploy/', '--port', envPort, '--cors', options.cors ?? '*');

	const child = spawnInherited('func', args, { env: childEnv });
	forwardChildExit(child);
	return child;
}

/**
 * Starts a TSX-backed dev process using the caller-provided entrypoint and
 * environment.
 *
 * @param options - Optional entrypoint and environment overrides.
 * @returns The spawned TSX child process.
 */
export function runTsxDev(options: TsxRunnerOptions = {}): ChildProcess {
	const env = options.env ?? process.env;
	const child = spawnInherited('tsx', [options.entry ?? 'src/index.ts'], { env });
	forwardChildExit(child);
	return child;
}

/**
 * Starts the three Azurite worker processes using caller-supplied ports and
 * storage paths.
 *
 * @param options - Explicit Azurite ports, storage locations, and optional
 * environment.
 * @returns The spawned blob, queue, and table child processes.
 */
export function runAzuriteDev(options: AzuriteDevOptions): ChildProcess[] {
	const procSpecs: Array<[string, string[]]> = [
		['azurite-blob', [...((options.silent ?? true) ? ['--silent'] : []), '--blobPort', String(options.blobPort), '--location', path.resolve(options.blobLocation)]],
		['azurite-queue', [...((options.silent ?? true) ? ['--silent'] : []), '--queuePort', String(options.queuePort), '--location', path.resolve(options.queueLocation)]],
		['azurite-table', [...((options.silent ?? true) ? ['--silent'] : []), '--tablePort', String(options.tablePort), '--location', path.resolve(options.tableLocation)]],
	];

	const procs = procSpecs.map(([command, args]) => {
		const proc = spawnInherited(command, args, options.env ? { env: options.env } : {});
		proc.on('error', (error) => {
			console.error(`[azurite] failed to start ${command}: ${error.message}`);
			for (const runningProc of procs) {
				runningProc.kill();
			}
			process.exit(1);
		});
		return proc;
	});

	console.log(`[azurite] started (blob=${options.blobPort}, queue=${options.queuePort}, table=${options.tablePort})`);

	let exited = 0;
	for (const proc of procs) {
		proc.on('exit', (code, signal) => {
			if (isGracefulInterruptExit(signal, code)) {
				if (++exited === procs.length) {
					process.exit(0);
				}
				return;
			}

			console.error(`[azurite] process exited unexpectedly: code=${code} signal=${signal}`);
			for (const runningProc of procs) {
				runningProc.kill();
			}
			process.exit(code ?? 1);
		});
	}

	process.on('SIGINT', () => {
		for (const proc of procs) {
			proc.kill('SIGINT');
		}
	});
	process.on('SIGTERM', () => {
		for (const proc of procs) {
			proc.kill('SIGTERM');
		}
	});

	return procs;
}
