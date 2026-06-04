import { type ChildProcess, spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { forwardChildExit, isGracefulInterruptExit } from './dev-process.ts';
import { buildPortlessUrl, type PortlessHostnameKey, resolvePortlessHostnames } from './hostnames.ts';
import { buildViteArgs } from './vite.ts';
import { type ResolveWorkspaceRootOptions, resolveWorkspaceRoot } from './workspace.ts';
import { getAzuriteConnectionString, getAzuritePorts, getMongoConnectionString, getMongoPort } from './worktree-ports.ts';

export type ViteDevProfile = 'ui-community' | 'ui-staff';
export type TsxDevProfile = 'oauth2-mock' | 'mongo-memory-mock';

export interface RunnerOptions extends ResolveWorkspaceRootOptions {
	env?: NodeJS.ProcessEnv;
}

interface TsxRunnerOptions extends RunnerOptions {
	entry?: string;
}

type OverrideSpec = Record<string, { hostname: PortlessHostnameKey; path?: string }>;

function spawnInherited(command: string, args: string[], options: { env?: NodeJS.ProcessEnv } = {}): ChildProcess {
	return spawn(command, args, {
		stdio: 'inherit',
		env: options.env,
	});
}

function applyPortlessEnvOverrides(childEnv: NodeJS.ProcessEnv, overrideSpec: OverrideSpec, options: RunnerOptions, settings: { preserveExisting?: boolean } = {}): void {
	const env = options.env ?? process.env;
	if (!env['WORKTREE_NAME']) return;

	const hostnames = resolvePortlessHostnames(options);
	for (const [key, target] of Object.entries(overrideSpec)) {
		if (settings.preserveExisting && childEnv[key]) {
			continue;
		}

		childEnv[key] = buildPortlessUrl(hostnames[target.hostname], target.path ?? '');
	}
}

/**
 * Starts a Vite dev process using one of the shared Cellix UI profiles.
 */
export function runViteDev(profile: ViteDevProfile, options: RunnerOptions = {}): ChildProcess {
	const env = options.env ?? process.env;
	const childEnv = { ...env };

	if (profile === 'ui-community') {
		applyPortlessEnvOverrides(
			childEnv,
			{
				VITE_APP_UI_COMMUNITY_B2C_AUTHORITY: {
					hostname: 'mockAuth',
					path: '/community',
				},
				VITE_APP_UI_COMMUNITY_B2C_REDIRECT_URI: {
					hostname: 'uiCommunity',
					path: '/auth-redirect',
				},
				VITE_COMMON_API_ENDPOINT: { hostname: 'api', path: '/api/graphql' },
				VITE_APP_UI_COMMUNITY_BASE_URL: { hostname: 'uiCommunity' },
			},
			options,
		);
	} else {
		applyPortlessEnvOverrides(
			childEnv,
			{
				VITE_APP_UI_STAFF_AAD_AUTHORITY: { hostname: 'mockAuth', path: '/staff' },
				VITE_APP_UI_STAFF_AAD_REDIRECT_URI: {
					hostname: 'uiStaff',
					path: '/auth-redirect',
				},
				VITE_COMMON_API_ENDPOINT: { hostname: 'api', path: '/api/graphql' },
			},
			options,
		);
	}

	const child = spawnInherited(
		'vite',
		buildViteArgs({
			...(env['HOST'] ? { host: env['HOST'] } : {}),
			...(env['PORT'] ? { port: env['PORT'] } : {}),
			env,
		}),
		{ env: childEnv },
	);
	forwardChildExit(child);
	return child;
}

/**
 * Starts the Docusaurus dev server with the shared local-dev defaults.
 */
export function runDocusaurusDev(options: RunnerOptions = {}): ChildProcess {
	const env = options.env ?? process.env;
	const child = spawnInherited('docusaurus', ['start', '--port', env['PORT'] ?? '3001', '--host', '127.0.0.1', '--no-open']);
	forwardChildExit(child);
	return child;
}

/**
 * Starts the API Azure Functions process with shared CA, CORS, and worktree overrides.
 */
export function runAzureFunctionsDev(options: RunnerOptions = {}): ChildProcess {
	const env = options.env ?? process.env;
	const envPort = env['PORT'];

	if (!envPort) {
		throw new Error('[local-dev] PORT environment variable is not set. Start this command through portless.');
	}

	const childEnv: NodeJS.ProcessEnv = {
		...env,
		NODE_EXTRA_CA_CERTS: env['PORTLESS_CA_PATH'] ?? path.join(os.homedir(), '.portless', 'ca.pem'),
		NODE_OPTIONS: `${env['NODE_OPTIONS'] ?? ''} --use-system-ca`.trim(),
	};

	if (env['WORKTREE_NAME']) {
		applyPortlessEnvOverrides(
			childEnv,
			{
				ACCOUNT_PORTAL_OIDC_ISSUER: { hostname: 'mockAuth', path: '/community' },
				ACCOUNT_PORTAL_OIDC_ENDPOINT: {
					hostname: 'mockAuth',
					path: '/community/.well-known/jwks.json',
				},
				STAFF_PORTAL_OIDC_ISSUER: { hostname: 'mockAuth', path: '/staff' },
				STAFF_PORTAL_OIDC_ENDPOINT: {
					hostname: 'mockAuth',
					path: '/staff/.well-known/jwks.json',
				},
			},
			options,
			{ preserveExisting: true },
		);
		childEnv['COSMOSDB_CONNECTION_STRING'] ??= getMongoConnectionString(options);
		childEnv['AZURE_STORAGE_CONNECTION_STRING'] ??= getAzuriteConnectionString(options);
		childEnv['AzureWebJobsStorage'] ??= getAzuriteConnectionString(options);
		childEnv['languageWorkers__node__arguments'] ??= '';
	}

	const child = spawnInherited('func', ['start', '--typescript', '--script-root', 'deploy/', '--port', envPort, '--cors', '*'], { env: childEnv });
	forwardChildExit(child);
	return child;
}

/**
 * Starts a TSX-backed mock service using one of the shared Cellix profiles.
 */
export function runTsxDev(profile: TsxDevProfile, options: TsxRunnerOptions = {}): ChildProcess {
	const env = options.env ?? process.env;
	const childEnv: NodeJS.ProcessEnv = { ...env };

	if (profile === 'oauth2-mock') {
		applyPortlessEnvOverrides(
			childEnv,
			{
				BASE_URL: { hostname: 'mockAuth' },
				VITE_APP_UI_COMMUNITY_B2C_REDIRECT_URI: {
					hostname: 'uiCommunity',
					path: '/auth-redirect',
				},
				VITE_APP_UI_STAFF_AAD_REDIRECT_URI: {
					hostname: 'uiStaff',
					path: '/auth-redirect',
				},
			},
			options,
		);
	} else if (profile === 'mongo-memory-mock') {
		childEnv['PORT'] = String(getMongoPort(env['WORKTREE_NAME']));
	}

	const child = spawnInherited('tsx', [options.entry ?? 'src/index.ts'], { env: childEnv });
	forwardChildExit(child);
	return child;
}

/**
 * Starts the three Azurite worker processes with worktree-scoped ports and storage paths.
 */
export function runAzuriteDev(options: RunnerOptions = {}): ChildProcess[] {
	const env = options.env ?? process.env;
	const workspaceRoot = resolveWorkspaceRoot(options);
	const ports = getAzuritePorts(env['WORKTREE_NAME']);
	const storageSuffix = env['WORKTREE_NAME'] ? `-${env['WORKTREE_NAME']}` : '';

	const procSpecs: Array<[string, string[]]> = [
		['azurite-blob', ['--silent', '--blobPort', String(ports.blob), '--location', path.join(workspaceRoot, `__blobstorage__${storageSuffix}`)]],
		['azurite-queue', ['--silent', '--queuePort', String(ports.queue), '--location', path.join(workspaceRoot, `__queuestorage__${storageSuffix}`)]],
		['azurite-table', ['--silent', '--tablePort', String(ports.table), '--location', path.join(workspaceRoot, `__tablestorage__${storageSuffix}`)]],
	];

	const procs = procSpecs.map(([command, args]) => {
		const proc = spawnInherited(command, args);
		proc.on('error', (error) => {
			console.error(`[azurite] failed to start ${command}: ${error.message}`);
			for (const runningProc of procs) {
				runningProc.kill();
			}
			process.exit(1);
		});
		return proc;
	});

	console.log(`[azurite] started (blob=${ports.blob}, queue=${ports.queue}, table=${ports.table})`);

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
