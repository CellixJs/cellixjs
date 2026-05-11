import express from 'express';
import { buildOidcRouter } from './router.ts';
import type { MockOAuth2PortalConfig, MockOAuth2ServerConfig, MockOAuth2ServerHandle } from './types.ts';

/**
 * Starts a single mock OAuth2/OIDC server instance for one portal configuration.
 *
 * @param config - Server host, port, issuer base URL, redirect settings, and optional user store.
 * @returns A promise that resolves to the running server handle and async disposer.
 *
 * @example
 * ```ts
 * const handle = await startMockOAuth2Server({
 *   port: 38204,
 *   baseUrl: 'http://localhost:38204',
 *   allowedRedirectUris: new Set(['http://localhost:3000/callback']),
 *   allowedRedirectUri: 'http://localhost:3000/callback',
 *   redirectUriToAudience: new Map([['http://localhost:3000/callback', 'mock-client']]),
 *   getUserProfile: () => ({ email: 'test@example.com' }),
 * });
 *
 * await handle.disposer.stop();
 * ```
 */
export async function startMockOAuth2Server(config: MockOAuth2ServerConfig): Promise<MockOAuth2ServerHandle> {
	const app = express();
	app.disable('x-powered-by');

	const router = await buildOidcRouter(config.baseUrl, config as unknown as MockOAuth2PortalConfig);
	app.use('/', router);

	return new Promise<MockOAuth2ServerHandle>((resolve, reject) => {
		const server = app.listen(config.port, config.host ?? 'localhost', () => {
			console.log(`Mock OAuth2 server running on ${config.baseUrl}`);
			console.log(`JWKS endpoint running on ${config.baseUrl}/.well-known/jwks.json`);

			const disposer = {
				stop: () => {
					return new Promise<void>((resolveStop, rejectStop) => {
						server.close((err) => {
							if (err) rejectStop(err);
							else resolveStop();
						});
					});
				},
			};

			resolve({ server, disposer });
		});

		server.on('error', reject);
	});
}
