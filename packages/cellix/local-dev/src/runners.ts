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
	env?: NodeJS.ProcessEnv;
}

export interface TsxRunnerOptions extends RunnerOptions {
	entry?: string;
}

export interface AzureFunctionsDevOptions extends RunnerOptions {
	port?: string;
	scriptRoot?: string;
	cors?: string;
	typescript?: boolean;
}

export interface AzuriteDevOptions extends RunnerOptions {
	blobPort: number;
	queuePort: number;
	tablePort: number;
	blobLocation: string;
	queueLocation: string;
	tableLocation: string;
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
