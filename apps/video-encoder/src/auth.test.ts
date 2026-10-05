import { randomUUID } from 'node:crypto';
import type { SignInResult } from '@ocom/video-encoder-client';
import { describe, expect, it, vi } from 'vitest';
import { createAuth } from './auth.ts';
import type { SessionStore, StoredSession } from './session.ts';

/** Random token values, so no test fixture looks like a hard-coded secret. */
const token = {
	saved: randomUUID(),
	old: randomUUID(),
	refreshed: randomUUID(),
	signedIn: randomUUID(),
	refresh1: randomUUID(),
	refresh2: randomUUID(),
	refreshNew: randomUUID(),
	other: randomUUID(),
};

const config = { issuer: 'https://issuer', clientId: 'client', scope: 'openid offline_access' };
const now = Date.parse('2026-10-05T12:00:00Z');
const result = (accessToken: string, minutes: number, refreshToken?: string): SignInResult => ({
	accessToken,
	expiresAt: new Date(now + minutes * 60_000),
	...(refreshToken ? { refreshToken } : {}),
	claims: { name: 'Tia' },
});
const stored = (accessToken: string, minutes: number, overrides: Partial<StoredSession> = {}): StoredSession => ({
	issuer: config.issuer,
	clientId: config.clientId,
	accessToken,
	expiresAt: new Date(now + minutes * 60_000).toISOString(),
	refreshToken: token.refresh1,
	claims: { name: 'Tia' },
	...overrides,
});

function setup(saved?: StoredSession) {
	const store: SessionStore & { saved: StoredSession | undefined } = {
		saved,
		load: vi.fn(() => Promise.resolve(store.saved)),
		save: vi.fn((session: StoredSession) => {
			store.saved = session;
			return Promise.resolve();
		}),
		clear: vi.fn(() => {
			store.saved = undefined;
			return Promise.resolve();
		}),
	};
	const signIn = vi.fn(() => Promise.resolve(result(token.signedIn, 60, token.refreshNew)));
	const refresh = vi.fn(() => Promise.resolve(result(token.refreshed, 60, token.refresh2)));
	const openUrl = vi.fn();
	const log = vi.fn();
	const auth = createAuth({ config, store, signIn, refresh, openUrl, log, now: () => now });
	return { auth, store, signIn, refresh, openUrl, log };
}

describe('createAuth', () => {
	it('uses a saved token that is not about to expire', async () => {
		const { auth, signIn, refresh } = setup(stored(token.saved, 30));

		await expect(auth.getAccessToken()).resolves.toBe(token.saved);
		expect(signIn).not.toHaveBeenCalled();
		expect(refresh).not.toHaveBeenCalled();
	});

	it('refreshes a token that is about to expire and saves the new session', async () => {
		const { auth, store, refresh } = setup(stored(token.old, 1));

		await expect(auth.getAccessToken()).resolves.toBe(token.refreshed);
		expect(refresh).toHaveBeenCalledWith({ issuer: config.issuer, clientId: config.clientId, refreshToken: token.refresh1, claims: { name: 'Tia' } });
		expect(store.saved).toMatchObject({ accessToken: token.refreshed, refreshToken: token.refresh2 });
	});

	it('signs in through the browser when the refresh is rejected', async () => {
		const { auth, signIn, refresh, log } = setup(stored(token.old, -5));
		refresh.mockRejectedValueOnce(new Error('invalid_grant'));

		await expect(auth.getAccessToken()).resolves.toBe(token.signedIn);
		expect(log).toHaveBeenCalledWith('Your sign-in has expired.');
		expect(signIn).toHaveBeenCalledWith(expect.objectContaining({ issuer: config.issuer, clientId: config.clientId, scope: config.scope }));
	});

	it('signs in when there is no refresh token', async () => {
		const { refreshToken: _none, ...withoutRefresh } = stored(token.old, -5);
		const { auth, signIn, refresh } = setup(withoutRefresh);

		await expect(auth.getAccessToken()).resolves.toBe(token.signedIn);
		expect(refresh).not.toHaveBeenCalled();
		expect(signIn).toHaveBeenCalledTimes(1);
	});

	it('ignores a session saved for another issuer or client', async () => {
		const { auth, signIn } = setup(stored(token.other, 30, { issuer: 'https://other-issuer' }));

		await expect(auth.getAccessToken()).resolves.toBe(token.signedIn);
		expect(signIn).toHaveBeenCalledTimes(1);
	});

	it('shares one renewal between concurrent requests', async () => {
		const { auth, signIn } = setup();

		const tokens = await Promise.all([auth.getAccessToken(), auth.getAccessToken(), auth.getAccessToken()]);

		expect(tokens).toEqual([token.signedIn, token.signedIn, token.signedIn]);
		expect(signIn).toHaveBeenCalledTimes(1);
	});

	it('logs in again on request and forgets the session on logout', async () => {
		const { auth, store, signIn } = setup(stored(token.saved, 30));

		await auth.login();
		expect(signIn).toHaveBeenCalledTimes(1);
		await auth.logout();

		expect(store.saved).toBeUndefined();
		await expect(auth.getAccessToken()).resolves.toBe(token.signedIn);
	});
});
