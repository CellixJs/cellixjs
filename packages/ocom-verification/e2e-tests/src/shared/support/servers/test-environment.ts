import { execFileSync } from 'node:child_process';
import { getPortlessPath } from './resolve-portless.ts';

let proxyInitialized = false;
let mongoConnectionString: string | undefined;

export function initTestEnvironment() {
	if (proxyInitialized) return;

	// Clean up orphaned route locks from previous runs that crashed or were killed.
	// The proxy itself is started by the test:e2e script so the portless CA exists
	// before Node reads NODE_EXTRA_CA_CERTS at startup.
	execFileSync(getPortlessPath(), ['prune'], {
		timeout: 10_000,
		stdio: 'pipe',
	});

	proxyInitialized = true;
}

export function buildUrl(hostname: string, path = ''): string {
	return `https://${hostname}:1355${path}`;
}

/**
 * Mock OIDC URLs derived from the portless hostname and the portal name
 * registered by server-oauth2-mock (via apps/ui-community/mock-oidc.json).
 *
 * These are hardcoded here so the e2e test infrastructure is self-contained
 * and does not depend on potentially-stale local.settings.json values.
 */
export const mockOidcIssuer = buildUrl('mock-auth.ownercommunity.localhost', '/community');
export const mockOidcEndpoint = `${mockOidcIssuer}/.well-known/jwks.json`;
export const mockOidcAudience = 'mock-client';

export const mockStaffOidcIssuer = buildUrl('mock-auth.ownercommunity.localhost', '/staff');

export function setMongoConnectionString(connStr: string): void {
	mongoConnectionString = connStr;
}

export function getMongoConnectionString(): string {
	if (!mongoConnectionString) throw new Error('MongoDB connection string not set. Start MongoDBTestServer first.');
	return mongoConnectionString;
}

export function cleanupTestEnvironment(): void {
	proxyInitialized = false;
	mongoConnectionString = undefined;
}
