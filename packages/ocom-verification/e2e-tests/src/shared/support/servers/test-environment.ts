import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPortlessUrl, getHostnames } from '@ocom-verification/verification-shared/settings';
import { getPortlessPath } from './resolve-portless.ts';

let proxyInitialized = false;
let mongoConnectionString: string | undefined;

loadE2EEnvDefaults();

/** Module-level hostnames derived from .env files (matches dev:worktree pattern). */
const hostnames = getHostnames();

/** OIDC issuer URL for the community portal on the mock auth server. */
export const mockOidcIssuer = buildPortlessUrl(hostnames.mockAuth, '/community');

/** JWKS endpoint used as the OIDC discovery / probe URL. */
export const mockOidcEndpoint = `${mockOidcIssuer}/.well-known/jwks.json`;

/**
 * Ensure the portless proxy is running. The `proxy start` invocation is idempotent,
 * if another worktree or dev session already started it on the shared port,
 * this returns immediately.
 */
export function initTestEnvironment() {
	if (proxyInitialized) return;

	execFileSync(getPortlessPath(), ['proxy', 'start', '--https', '-p', '1355'], {
		timeout: 15_000,
		stdio: 'pipe',
	});

	proxyInitialized = true;
}

export { buildPortlessUrl as buildUrl, getHostnames };

export function setMongoConnectionString(connStr: string): void {
	mongoConnectionString = connStr;
}

export function getMongoConnectionString(): string {
	if (!mongoConnectionString) {
		throw new Error('MongoDB connection string not set — call setMongoConnectionString() first');
	}
	return mongoConnectionString;
}

export function cleanupTestEnvironment(): void {
	proxyInitialized = false;
	mongoConnectionString = undefined;
}

function loadE2EEnvDefaults(): void {
	const currentDir = dirname(fileURLToPath(import.meta.url));
	const workspaceRoot = resolve(currentDir, '../../../../../../..');
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
