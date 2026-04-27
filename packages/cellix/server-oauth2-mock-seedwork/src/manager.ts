import express from 'express';
import { buildOidcRouter } from './router.ts';
import type { MockOAuth2Manager, MockOAuth2PortalConfig, MockOAuth2Registration, MockOAuth2ServerHandle } from './types.ts';
import { normalizeBaseUrl, SAFE_NAME_RE } from './utils.ts';

export function createMockOAuth2Manager(serverConfig: { port: number; host?: string; baseUrl: string }): MockOAuth2Manager {
	let app: express.Express | null = null;
	let serverHandle: MockOAuth2ServerHandle | null = null;
	let startupPromise: Promise<MockOAuth2ServerHandle> | null = null;
	let stopping = false;
	let startGeneration = 0;
	const registeredNames = new Set<string>();

	const ensureStarted = (): Promise<MockOAuth2ServerHandle> => {
		if (startupPromise !== null) return startupPromise;
		if (stopping) {
			return Promise.reject(new Error('[server-oauth2-mock] Server is shutting down; cannot start'));
		}
		if (!app) {
			app = express();
			app.disable('x-powered-by');
		}
		const gen = startGeneration;
		startupPromise = new Promise<MockOAuth2ServerHandle>((resolve, reject) => {
			const a = app;
			if (!a) {
				startupPromise = null;
				return reject(new Error('[server-oauth2-mock] express app not initialized'));
			}
			const s = a.listen(serverConfig.port, serverConfig.host ?? 'localhost', () => {
				console.log(`Mock OAuth2 server running on ${serverConfig.baseUrl}`);
				console.log(`JWKS endpoint running on ${serverConfig.baseUrl}/.well-known/jwks.json`);
				const disposer = {
					stop: () =>
						new Promise<void>((resolveStop, rejectStop) => {
							s.close((err) => {
								if (err) rejectStop(err);
								else resolveStop();
							});
						}),
				};
				const handle: MockOAuth2ServerHandle = { server: s, disposer };
				if (gen !== startGeneration || stopping) {
					handle.disposer.stop().catch(() => {
						/* ignore stop error during forced shutdown */
					});
					startupPromise = null;
					return reject(new Error('[server-oauth2-mock] Server stopped before startup completed'));
				}
				serverHandle = handle;
				resolve(handle);
			});
			s.on('error', (err) => {
				app = null;
				serverHandle = null;
				registeredNames.clear();
				stopping = false;
				const sp = startupPromise;
				startupPromise = null;
				if (sp !== null) reject(err);
			});
		});
		return startupPromise;
	};

	return {
		async register(name: string, config: MockOAuth2PortalConfig) {
			if (!SAFE_NAME_RE.test(name)) throw new Error(`[server-oauth2-mock] Invalid portal name "${name}": must contain letters, digits, '_' and '-' only`);
			if (registeredNames.has(name)) throw new Error(`[server-oauth2-mock] Registration with name "${name}" already exists`);
			await ensureStarted();
			if (registeredNames.has(name)) throw new Error(`[server-oauth2-mock] Registration with name "${name}" already exists`);
			registeredNames.add(name);
			try {
				const issuerBase = `${normalizeBaseUrl(serverConfig.baseUrl)}/${name}`;
				const router = await buildOidcRouter(issuerBase, config);
				if (!app) throw new Error('[server-oauth2-mock] express app not initialized');
				app.use(`/${name}`, router);
			} catch (err) {
				registeredNames.delete(name);
				throw err;
			}
			if (!serverHandle) throw new Error('[server-oauth2-mock] server not started');
			return { server: serverHandle.server, disposer: serverHandle.disposer, baseUrl: `${normalizeBaseUrl(serverConfig.baseUrl)}/${name}`, name } as MockOAuth2Registration;
		},
		async stopAll() {
			stopping = true;
			startGeneration++;
			const pending = startupPromise;
			startupPromise = null;
			if (pending !== null) {
				try {
					const handle = await pending;
					await handle.disposer.stop();
					serverHandle = null;
				} catch {
					/* ignore startup cancellation or failure */
				}
			}
			if (serverHandle) {
				await serverHandle.disposer.stop();
				serverHandle = null;
			}
			app = null;
			registeredNames.clear();
			stopping = false;
		},
	};
}
