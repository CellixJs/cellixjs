import express from 'express';
import { buildOidcRouter } from './router.ts';
import type { MockOAuth2PortalConfig, MockOAuth2ServerConfig, MockOAuth2ServerHandle } from './types.ts';

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
