import crypto from 'node:crypto';
import path from 'node:path';
import { createMockOAuth2Manager, type MockOAuth2ServerConfig } from '@cellix/server-oauth2-mock-seedwork';
import { discoverPortalConfigs, type PortalOidcConfig, setupEnvironment } from './setup-environment.js';

setupEnvironment();

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const appsDir = path.resolve(__dirname, '../../');
const env = process.env as Record<string, string | undefined>;
const portBase = Number.parseInt(env['PORT_BASE'] ?? '3001', 10);

const portals: PortalOidcConfig[] = discoverPortalConfigs(appsDir, portBase);

if (portals.length === 0) {
	console.error('[server-oauth2-mock] No portal configs discovered. Ensure at least one apps/ui-*/mock-oidc.json exists.');
	process.exit(1);
}

try {
	const manager = createMockOAuth2Manager();

	for (const portal of portals) {
		const config: MockOAuth2ServerConfig = {
			port: portal.port,
			baseUrl: portal.baseUrl,
			host: '127.0.0.1',
			allowedRedirectUris: new Set([portal.redirectUri]),
			allowedRedirectUri: portal.redirectUri,
			redirectUriToAudience: new Map([[portal.redirectUri, portal.clientId]]),
			getUserProfile: () => ({
				sub: portal.claims['sub'] ?? crypto.randomUUID(),
				email: portal.claims['email'] ?? 'test@example.com',
				given_name: portal.claims['given_name'] ?? 'Test',
				family_name: portal.claims['family_name'] ?? 'User',
				tid: portal.claims['tid'] ?? 'test-tenant-id',
				...portal.claims,
			}),
		};

		await manager.register(portal.name, config);
		console.log(`[server-oauth2-mock] Registered OIDC config "${portal.name}" on port ${portal.port}`);
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
