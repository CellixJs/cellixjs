import { execFileSync } from 'node:child_process';
import { buildPortlessUrl, getHostnames } from '@ocom-verification/verification-shared/settings';
import { applyE2EDefaultsToEnv } from './e2e-defaults.ts';
import { getPortlessPath } from './resolve-portless.ts';

let proxyInitialized = false;
let mongoConnectionString: string | undefined;

/** Module-level hostnames derived from .env files (matches dev:worktree pattern). */
const hostnames = getHostnames();

/** OIDC issuer URL for the community portal on the mock auth server. */
export const mockOidcIssuer = buildPortlessUrl(hostnames.mockAuth, '/community');

/** JWKS endpoint used as the OIDC discovery / probe URL. */
export const mockOidcEndpoint = `${mockOidcIssuer}/.well-known/jwks.json`;

/**
 * Apply e2e env defaults (so CI runs without local.settings.json) and ensure
 * the portless proxy is running. The `proxy start` invocation is idempotent —
 * if another worktree or dev session already started it on the shared port,
 * this returns immediately.
 */
export function initTestEnvironment() {
	if (proxyInitialized) return;

	applyE2EDefaultsToEnv();

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
