import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAzuritePorts, getMongoPort } from '@ocom-verification/verification-shared/environment';
import { getPortlessPath } from './resolve-portless.ts';

let proxyInitialized = false;

loadE2EEnvDefaults();

export type OcomPortlessHostKey = 'api' | 'mockAuth' | 'uiCommunity' | 'uiStaff';

export function getHostnames(): Record<OcomPortlessHostKey | 'docs', string> {
	const hostnames = resolvePortlessHostnames({
		keys: {
			api: 'VITE_COMMON_API_ENDPOINT',
			mockAuth: 'VITE_APP_UI_COMMUNITY_END_USER_B2C_AUTHORITY',
			uiCommunity: 'VITE_APP_UI_COMMUNITY_BASE_URL',
			uiStaff: 'VITE_APP_UI_STAFF_STAFF_USER_AAD_REDIRECT_URI',
		},
	});

	return {
		...hostnames,
		docs: `docs.${hostnames.uiCommunity}`,
	};
}

const hostnames = getHostnames();

export const mockOidcAudience = 'mock-client';
export const mockOidcIssuer = buildUrl(hostnames.mockAuth, '/community-end-user');
export const mockOidcEndpoint = `${mockOidcIssuer}/.well-known/jwks.json`;
export const mockStaffOidcIssuer = buildUrl(hostnames.mockAuth, '/staff-staff-user');

/**
 * Ensure the portless proxy is running for the PR's worktree-scoped hostnames.
 */
export function initTestEnvironment() {
	if (proxyInitialized) return;

	execFileSync(getPortlessPath(), ['prune'], {
		timeout: 10_000,
		stdio: 'pipe',
	});
	execFileSync(getPortlessPath(), ['proxy', 'start', '--https', '-p', '1355'], {
		timeout: 15_000,
		stdio: 'pipe',
	});

	proxyInitialized = true;
}

export function buildUrl(hostname: string, path = ''): string {
	return `https://${hostname}:1355${path}`;
}

export function cleanupTestEnvironment(): void {
	proxyInitialized = false;
}

function loadE2EEnvDefaults(): void {
	process.env['E2E'] ??= 'true';

	const currentDir = dirname(fileURLToPath(import.meta.url));
	const workspaceRoot = resolve(currentDir, '../../../../../..');
	loadApiLocalSettings(resolve(workspaceRoot, 'apps/api/local-settings.e2e.json'));
	for (const filePath of [resolve(workspaceRoot, 'apps/ui-community/.env.e2e'), resolve(workspaceRoot, 'apps/ui-staff/.env.e2e')]) {
		if (!existsSync(filePath)) continue;
		for (const line of readFileSync(filePath, 'utf-8').split('\n')) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;
			const idx = trimmed.indexOf('=');
			if (idx === -1) continue;
			const key = trimmed.slice(0, idx);
			process.env[key] ??= trimmed.slice(idx + 1);
		}
	}

	applyWorktreeServiceEnv();
}

/**
 * Retarget the pinned service settings at the current worktree's ports and host.
 *
 * `local-settings.e2e.json` pins the default Azurite ports (10000–10002), the
 * default Mongo port (50000), and the un-suffixed mock-auth host. In worktree
 * mode the test servers instead bind the offset ports from
 * {@link getAzuritePorts}/{@link getMongoPort} and register the
 * `.${WORKTREE_NAME}.localhost` host. Because `test-environment.ts` seeds these
 * values into `process.env`, the pinned defaults leak into the spawned Functions
 * host (defeating the `??=` worktree overrides in `apps/api/start-dev.mjs`) and
 * into the queue verification client — so the API blocks on Mongo/queue startup
 * against the wrong ports and token validation hits the wrong host.
 *
 * No-op when `WORKTREE_NAME` is unset (offset 0, host unchanged).
 */
function applyWorktreeServiceEnv(): void {
	const worktreeName = process.env['WORKTREE_NAME'];
	if (!worktreeName) return;

	const { blob, queue, table } = getAzuritePorts();
	const azurite = process.env['AZURE_STORAGE_CONNECTION_STRING'];
	if (azurite) {
		const worktreeAzurite = azurite.replace('127.0.0.1:10000', `127.0.0.1:${blob}`).replace('127.0.0.1:10001', `127.0.0.1:${queue}`).replace('127.0.0.1:10002', `127.0.0.1:${table}`);
		process.env['AZURE_STORAGE_CONNECTION_STRING'] = worktreeAzurite;
		// `AzureWebJobsStorage` is pinned to `UseDevelopmentStorage=true` (default
		// ports); replace it with the explicit worktree connection string so the
		// Functions host targets the offset ports, matching start-dev.mjs.
		process.env['AzureWebJobsStorage'] = worktreeAzurite;
	}

	const mongo = process.env['COSMOSDB_CONNECTION_STRING'];
	if (mongo) {
		process.env['COSMOSDB_CONNECTION_STRING'] = mongo.replace('127.0.0.1:50000', `127.0.0.1:${getMongoPort()}`);
	}

	// The mock-auth OIDC endpoints/issuers are pinned to the un-suffixed host;
	// retarget them at the worktree host so JWKS fetches reach the running server.
	for (const key of ['ACCOUNT_PORTAL_OIDC_ENDPOINT', 'ACCOUNT_PORTAL_OIDC_ISSUER', 'STAFF_PORTAL_OIDC_ENDPOINT', 'STAFF_PORTAL_OIDC_ISSUER']) {
		const value = process.env[key];
		if (value) process.env[key] = value.replace('.localhost', `.${worktreeName}.localhost`);
	}
}

function loadApiLocalSettings(filePath: string): void {
	if (!existsSync(filePath)) return;

	const parsed = JSON.parse(readFileSync(filePath, 'utf-8')) as {
		Values?: Record<string, string | boolean | number>;
	};

	for (const [key, value] of Object.entries(parsed.Values ?? {})) {
		process.env[key] ??= String(value);
	}
}

interface ResolvePortlessHostnamesOptions<TKey extends string> {
	keys: Record<TKey, string>;
	env?: NodeJS.ProcessEnv;
	worktreeName?: string;
}

function resolvePortlessHostnames<TKey extends string>(options: ResolvePortlessHostnamesOptions<TKey>): Record<TKey, string> {
	const env = options.env ?? process.env;
	const worktreeName = options.worktreeName ?? env['WORKTREE_NAME'] ?? '';
	const hostnames = {} as Record<TKey, string>;

	for (const [logicalName, envName] of Object.entries(options.keys) as Array<[TKey, string]>) {
		hostnames[logicalName] = applyWorktreeSuffix(requireHostname(envName, env), worktreeName);
	}

	return hostnames;
}

function applyWorktreeSuffix(hostname: string, worktreeName: string): string {
	if (!worktreeName) return hostname;
	return hostname.replace('.localhost', `.${worktreeName}.localhost`);
}

function requireHostname(key: string, env: NodeJS.ProcessEnv): string {
	const url = env[key] ?? '';
	try {
		return new URL(url).hostname;
	} catch {
		throw new Error(`e2e test environment: required env var ${key} is missing or invalid`);
	}
}
