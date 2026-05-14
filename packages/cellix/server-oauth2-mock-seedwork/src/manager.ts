import express from 'express';
import { buildOidcRouter } from './router.ts';
import type { MockOAuth2Manager, MockOAuth2PortalConfig, MockOAuth2Registration, MockOAuth2ServerHandle } from './types.ts';
import { normalizeBaseUrl, SAFE_NAME_RE } from './utils.ts';

/**
 * Creates a reusable mock OAuth2 manager that can register multiple named portal
 * configurations on one Express server.
 *
 * @param serverConfig - Shared server configuration including `port`, optional `host`,
 * externally visible `baseUrl`, and optional `trustProxy`. Set `trustProxy: true` to
 * always trust proxy headers (`X-Forwarded-*`), or `trustProxy: false` to disable
 * proxy trust entirely. When `trustProxy` is omitted, it defaults to enabled only for
 * loopback hosts (`127.0.0.1`, `localhost`, `::1`) inferred from `host` or `baseUrl`;
 * otherwise proxy headers are not trusted.
 * @returns A manager that lazily starts the server on first registration and can stop all registrations.
 *
 * @example
 * ```ts
 * const manager = createMockOAuth2Manager({
 *   port: 38200,
 *   host: '127.0.0.1',
 *   baseUrl: 'http://127.0.0.1:38200',
 * });
 *
 * await manager.register('portal', config);
 * await manager.stopAll();
 * ```
 */
export function createMockOAuth2Manager(serverConfig: { port: number; host?: string; baseUrl: string; trustProxy?: boolean }): MockOAuth2Manager {
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
			// Trust proxy is enabled explicitly (trustProxy: true), or by default for local loopback
			// hosts (127.0.0.1, localhost, ::1). An explicit trustProxy: false disables it entirely.
			// Trusting X-Forwarded-* headers can be a security and logging concern when running
			// outside a trusted proxy, so defaults are conservative.
			let shouldTrust = false;
			if (serverConfig.trustProxy === true) {
				shouldTrust = true;
			} else if (serverConfig.trustProxy === false) {
				shouldTrust = false;
			} else {
				// trustProxy is undefined; infer from host being loopback
				try {
					const host = serverConfig.host ?? new URL(serverConfig.baseUrl).hostname;
					if (host === '127.0.0.1' || host === 'localhost' || host === '::1') shouldTrust = true;
				} catch {
					// Ignore URL parse errors and keep default (no trust)
				}
			}
			if (shouldTrust) app.set('trust proxy', 1);
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
