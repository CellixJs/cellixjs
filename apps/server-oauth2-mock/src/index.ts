import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMockOAuth2Manager, type MockOAuth2PortalConfig, normalizeBaseUrl } from '@cellix/server-oauth2-mock-seedwork';
import { discoverPortalConfigs, type PortalOidcConfig } from './portal-discovery.ts';
import { setupEnvironment } from './setup-environment.ts';

setupEnvironment();

const { PORT, BASE_URL } = process.env;

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
const appsDir = path.join(repoRoot, 'apps');
const rawPort = Number.parseInt(PORT ?? '1355', 10);
const port = Number.isFinite(rawPort) && rawPort > 0 ? rawPort : 1355;
// BASE_URL must be the externally-visible origin used as the OIDC issuer.
// In local dev the portless proxy handles TLS termination and host mapping.
const baseUrl = BASE_URL ?? `https://mock-auth.ownercommunity.localhost${port === 443 ? '' : `:${port}`}`;

const portals: PortalOidcConfig[] = discoverPortalConfigs(appsDir);

if (portals.length === 0) {
	console.error('[server-oauth2-mock] No portal configs discovered. Ensure at least one apps/ui-*/mock-oidc.json exists.');
	process.exit(1);
}

try {
	const manager = createMockOAuth2Manager({ port, host: '127.0.0.1', baseUrl: normalizeBaseUrl(baseUrl) });

	for (const portal of portals) {
		const config: MockOAuth2PortalConfig = {
			allowedRedirectUris: new Set([portal.redirectUri]),
			allowedRedirectUri: portal.redirectUri,
			redirectUriToAudience: new Map([[portal.redirectUri, portal.clientId]]),
			getUserProfile: () => {
				const claims = portal.claims ?? {};
				// Destructure sub separately so we can omit it when not explicitly configured,
				// allowing the router to fall back to persistedSub (stable per auth-code).
				const { sub: claimsSub, ...restClaims } = claims;

				const ensureStringClaim = (key: string, fallback: string): string => {
					const value = claims[key];
					if (value === undefined || value === null) return fallback;
					if (typeof value === 'string') return value;
					console.warn(`[server-oauth2-mock] Ignoring non-string value for reserved claim "${key}" in portal "${portal.name}". ` + `Using fallback "${fallback}" instead.`);
					return fallback;
				};

				return {
					// spread restClaims (all except sub) first; known fields below override
					...restClaims,
					// Only include sub if explicitly configured as a string; absent sub means
					// the router uses persistedSub for stable identity across /token calls.
					...(typeof claimsSub === 'string' ? { sub: claimsSub } : {}),
					email: ensureStringClaim('email', 'test@example.com'),
					given_name: ensureStringClaim('given_name', 'Test'),
					family_name: ensureStringClaim('family_name', 'User'),
					tid: ensureStringClaim('tid', 'test-tenant-id'),
				};
			},
		};

		await manager.register(portal.name, config);
		console.log(`[server-oauth2-mock] Registered OIDC config "${portal.name}"`);
	}

	const shutdown = async (signal?: string, exitCode = 0) => {
		try {
			console.log(`Shutting down mock OAuth2 server (${signal ?? 'signal'})`);
			await manager.stopAll();
		} catch (err) {
			console.error('Error during mock OAuth2 server shutdown:', err);
		} finally {
			process.exit(exitCode);
		}
	};

	process.once('SIGINT', () => void shutdown('SIGINT'));
	process.once('SIGTERM', () => void shutdown('SIGTERM'));
	process.once('SIGQUIT', () => void shutdown('SIGQUIT'));
	process.once('uncaughtException', async (err) => {
		console.error('Uncaught exception, shutting down:', err);
		await shutdown('uncaughtException', 1);
	});
	process.once('unhandledRejection', async (reason) => {
		console.error('Unhandled rejection, shutting down:', reason);
		await shutdown('unhandledRejection', 1);
	});
} catch (error: unknown) {
	console.error('Failed to start mock OAuth2 server:', error);
	process.exit(1);
}
