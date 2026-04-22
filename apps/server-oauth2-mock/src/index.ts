import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMockOAuth2Manager, type MockOAuth2PortalConfig } from '@cellix/server-oauth2-mock-seedwork';
import { discoverPortalConfigs, type PortalOidcConfig, setupEnvironment } from './setup-environment.js';

setupEnvironment();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appsDir = path.join(__dirname, '../../..');
const port = Number.parseInt(process.env['PORT'] ?? '1355', 10);
const baseUrl = process.env['BASE_URL'] ?? `https://mock-auth.ownercommunity.localhost:${port}`;

const portals: PortalOidcConfig[] = discoverPortalConfigs(appsDir);

if (portals.length === 0) {
	console.error('[server-oauth2-mock] No portal configs discovered. Ensure at least one apps/ui-*/mock-oidc.json exists.');
	process.exit(1);
}

try {
	const manager = createMockOAuth2Manager({ port, host: '127.0.0.1', baseUrl });

	for (const portal of portals) {
		const config: MockOAuth2PortalConfig = {
			allowedRedirectUris: new Set([portal.redirectUri]),
			allowedRedirectUri: portal.redirectUri,
			redirectUriToAudience: new Map([[portal.redirectUri, portal.clientId]]),
			getUserProfile: () => ({
				// spread custom claims first so known string fields we set below always win and are correctly typed
				...portal.claims,
				sub: String(portal.claims['sub'] ?? crypto.randomUUID()),
				email: String(portal.claims['email'] ?? 'test@example.com'),
				given_name: String(portal.claims['given_name'] ?? 'Test'),
				'family_name': String(portal.claims['family_name'] ?? 'User'),
				tid: String(portal.claims['tid'] ?? 'test-tenant-id'),
			}),
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
