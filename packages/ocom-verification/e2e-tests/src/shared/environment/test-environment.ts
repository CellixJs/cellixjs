import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPortlessPath } from './resolve-portless.ts';

let proxyInitialized = false;

loadE2EEnvDefaults();

export type OcomPortlessHostKey = 'api' | 'mockAuth' | 'uiCommunity' | 'uiStaff';

export function getHostnames(): Record<OcomPortlessHostKey | 'docs', string> {
	const hostnames = resolvePortlessHostnames({
		keys: {
			api: 'VITE_COMMON_API_ENDPOINT',
			mockAuth: 'VITE_APP_UI_COMMUNITY_B2C_AUTHORITY',
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
