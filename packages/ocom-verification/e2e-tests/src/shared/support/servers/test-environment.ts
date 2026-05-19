import { execFileSync } from 'node:child_process';
import { buildPortlessUrl, getHostnames } from '@ocom-verification/verification-shared/settings';
import { getPortlessPath } from './resolve-portless.ts';

let proxyInitialized = false;
let mongoConnectionString: string | undefined;

/** Module-level hostnames derived from .env files (matches dev:portless pattern). */
const hostnames = getHostnames();

/** OIDC issuer URL for the community portal on the mock auth server. */
export const mockOidcIssuer = buildPortlessUrl(hostnames.mockAuth, '/community');

/** JWKS endpoint used as the OIDC discovery / probe URL. */
export const mockOidcEndpoint = `${mockOidcIssuer}/.well-known/jwks.json`;

/** Audience claim expected in JWTs issued by the mock OIDC server. */
export const mockOidcAudience = 'mock-client';

/**
 * Prune orphaned portless route locks from previous test runs.
 * The proxy itself is started by the `test:e2e` npm script before the
 * Cucumber process spawns, so we only need to clean stale locks here.
 */
export function initTestEnvironment() {
	if (proxyInitialized) return;

	execFileSync(getPortlessPath(), ['prune'], {
		timeout: 10_000,
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
