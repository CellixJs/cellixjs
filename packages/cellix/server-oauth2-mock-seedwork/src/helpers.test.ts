import crypto from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { buildEffectiveProfile, buildRedirectWithCode, extractClaimsFromPayload, normalizeUserInfo } from './helpers.ts';

describe('helpers.buildRedirectWithCode', () => {
	it('adds the code and state to a valid redirect uri', () => {
		const redirect = buildRedirectWithCode('http://localhost/callback?existing=1', 'auth-code', 'state-1');
		const url = new URL(redirect);

		expect(url.searchParams.get('existing')).toBe('1');
		expect(url.searchParams.get('code')).toBe('auth-code');
		expect(url.searchParams.get('state')).toBe('state-1');
	});

	it('rejects invalid redirect uris', () => {
		expect(() => buildRedirectWithCode('not-a-url', 'auth-code')).toThrow('invalid_redirect_uri');
	});
});

describe('helpers.buildEffectiveProfile', () => {
	it('merges portal extras and user claims while stripping password and using the explicit sub', () => {
		const profile = buildEffectiveProfile(
			{ sub: 'portal-sub', tid: 'portal-tid', email: 'portal@example.com', locale: 'en-US' },
			{ email: 'user@example.com', given_name: 'Ada', password: 'secret', tid: 'user-tid' },
			'explicit-sub',
		);

		expect(profile).toEqual({
			email: 'user@example.com',
			given_name: 'Ada',
			locale: 'en-US',
			tid: 'user-tid',
			sub: 'explicit-sub',
		});
	});

	it('falls back to the portal sub or generates one when needed', () => {
		const generatedSub = '11111111-1111-1111-1111-111111111111';
		vi.spyOn(crypto, 'randomUUID').mockReturnValue(generatedSub);

		expect(buildEffectiveProfile({ sub: 'portal-sub', email: 'portal@example.com' })).toEqual({
			email: 'portal@example.com',
			sub: 'portal-sub',
		});
		expect(buildEffectiveProfile({ email: 'portal@example.com' })).toEqual({
			email: 'portal@example.com',
			sub: generatedSub,
		});
	});
});

describe('helpers.normalizeUserInfo', () => {
	it('derives username from preferred_username and name from given and family names', () => {
		const normalized = normalizeUserInfo({
			preferred_username: 'preferred-user',
			email: 'user@example.com',
			given_name: 'Grace',
			family_name: 'Hopper',
		});

		expect(normalized.username).toBe('preferred-user');
		expect(normalized.name).toBe('Grace Hopper');
	});

	it('falls back to the email prefix or sub when username is missing', () => {
		expect(normalizeUserInfo({ email: 'email-user@example.com' }).username).toBe('email-user');
		expect(normalizeUserInfo({ sub: 'subject-only' }).username).toBe('subject-only');
	});
});

describe('helpers.extractClaimsFromPayload', () => {
	it('keeps only string claim values used by the router', () => {
		expect(
			extractClaimsFromPayload({
				email: 'user@example.com',
				given_name: 'Ada',
				family_name: 'Lovelace',
				ignored: true,
			}),
		).toEqual({
			email: 'user@example.com',
			given_name: 'Ada',
			family_name: 'Lovelace',
		});
	});
});
