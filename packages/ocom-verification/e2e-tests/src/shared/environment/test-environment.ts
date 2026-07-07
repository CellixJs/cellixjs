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
}

function loadApiLocalSettings(filePath: string): void {
	if (!existsSync(filePath)) return;

	const parsed = JSON.parse(readFileSync(filePath, 'utf-8')) as {
		Values?: Record<string, string | boolean | number>;
	};

	for (const [key, value] of Object.entries(parsed.Values ?? {})) {
		// The committed settings assume the default (non-worktree) local ports and
		// hostnames. Patch worktree-scoped values before they land in process.env,
		// because they leak into spawned app servers whose own worktree overrides
		// use `??=` and therefore never win over inherited environment variables.
		process.env[key] ??= patchWorktreeSetting(key, String(value));
	}
}

function patchWorktreeSetting(key: string, value: string): string {
	const worktreeName = process.env['WORKTREE_NAME'];
	if (!worktreeName) return value;

	switch (key) {
		case 'COSMOSDB_CONNECTION_STRING':
			return withPort(value, getMongoPort());
		// Disable the Node.js inspector: its fixed port would collide with the
		// primary worktree's API dev server (mirrors start-dev.mjs worktree mode).
		case 'languageWorkers__node__arguments':
			return '';
		case 'AzureWebJobsStorage':
		case 'AZURE_STORAGE_CONNECTION_STRING':
			return worktreeAzuriteConnectionString();
		case 'ACCOUNT_PORTAL_OIDC_ENDPOINT':
		case 'ACCOUNT_PORTAL_OIDC_ISSUER':
		case 'STAFF_PORTAL_OIDC_ENDPOINT':
		case 'STAFF_PORTAL_OIDC_ISSUER': {
			const url = new URL(value);
			url.hostname = applyWorktreeSuffix(url.hostname, worktreeName);
			return url.toString().replace(/\/$/, value.endsWith('/') ? '/' : '');
		}
		default:
			return value;
	}
}

function withPort(connectionString: string, port: number): string {
	const url = new URL(connectionString);
	url.port = String(port);
	return url.toString();
}

function worktreeAzuriteConnectionString(): string {
	const { blob, queue, table } = getAzuritePorts();
	const account = 'devstoreaccount1';
	const key = 'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==';
	return [
		'DefaultEndpointsProtocol=http',
		`AccountName=${account}`,
		`AccountKey=${key}`,
		`BlobEndpoint=http://127.0.0.1:${blob}/${account}`,
		`QueueEndpoint=http://127.0.0.1:${queue}/${account}`,
		`TableEndpoint=http://127.0.0.1:${table}/${account}`,
	].join(';');
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
