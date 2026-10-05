import type { refreshSignIn, signInWithBrowser } from '@ocom/video-encoder-client';
import type { EncoderConfig } from './config.ts';
import { type SessionStore, type StoredSession, toStoredSession } from './session.ts';

/** Tokens this close to expiry are renewed first, so a request never carries an expired token. */
const ExpiryMarginMs = 2 * 60 * 1000;

interface AuthDependencies {
	config: EncoderConfig['auth'];
	store: SessionStore;
	signIn: typeof signInWithBrowser;
	refresh: typeof refreshSignIn;
	openUrl: (url: string) => Promise<void> | void;
	log: (message: string) => void;
	now?: () => number;
}

export interface Auth {
	/** A valid access token: the saved one, a refreshed one, or one from signing in again in the browser. */
	getAccessToken(): Promise<string>;
	/** Signs in through the browser, replacing any saved session. */
	login(): Promise<StoredSession>;
	logout(): Promise<void>;
}

export function createAuth(deps: AuthDependencies): Auth {
	const { config, store } = deps;
	const now = deps.now ?? Date.now;
	let current: StoredSession | undefined;
	let loaded = false;
	let pending: Promise<StoredSession> | undefined;

	const login = async () => {
		deps.log('Opening your browser to sign in...');
		const result = await deps.signIn({ issuer: config.issuer, clientId: config.clientId, scope: config.scope, openUrl: deps.openUrl });
		current = toStoredSession(config.issuer, config.clientId, result);
		await store.save(current);
		return current;
	};

	const renew = async (session: StoredSession | undefined): Promise<StoredSession> => {
		if (session?.refreshToken) {
			try {
				const result = await deps.refresh({ issuer: config.issuer, clientId: config.clientId, refreshToken: session.refreshToken, claims: session.claims });
				current = toStoredSession(config.issuer, config.clientId, result);
				await store.save(current);
				return current;
			} catch {
				deps.log('Your sign-in has expired.');
			}
		}
		return await login();
	};

	return {
		async getAccessToken() {
			if (!loaded) {
				const saved = await store.load();
				current = saved?.issuer === config.issuer && saved.clientId === config.clientId ? saved : undefined;
				loaded = true;
			}
			if (current && Date.parse(current.expiresAt) - ExpiryMarginMs > now()) {
				return current.accessToken;
			}
			// Concurrent requests share one renewal, so the browser opens at most once.
			pending ??= renew(current).finally(() => {
				pending = undefined;
			});
			return (await pending).accessToken;
		},
		login,
		async logout() {
			current = undefined;
			loaded = true;
			await store.clear();
		},
	};
}
