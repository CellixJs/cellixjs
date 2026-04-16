import { describe, expect, it } from 'vitest';
import { type MockOAuth2ServerConfig, type OidcProviderConfig, resolveProviderConfig } from '../src/index';

describe('resolveProviderConfig', () => {
	it('returns explicit provider when requested', () => {
		const cfg: MockOAuth2ServerConfig = {
			port: 0,
			baseUrl: 'http://legacy',
			allowedRedirectUris: new Set(['https://app.local/cb']),
			allowedRedirectUri: 'https://app.local/cb',
			redirectUriToAudience: new Map([['https://app.local/cb', 'cid']]),
			getUserProfile: () => ({ email: 'a@b.com', given_name: 'A', family_name: 'B' }),
			providers: {
				owner: { issuer: 'https://owner.local' },
				partner: { issuer: 'https://partner.local' },
			},
		};

		const p = resolveProviderConfig(cfg, 'partner');
		expect(p.issuer).toBe('https://partner.local');
	});

	it('falls back to single provider when providers map has one entry', () => {
		const cfg: MockOAuth2ServerConfig = {
			port: 0,
			allowedRedirectUris: new Set(['https://app.local/cb']),
			allowedRedirectUri: 'https://app.local/cb',
			redirectUriToAudience: new Map([['https://app.local/cb', 'cid']]),
			getUserProfile: () => ({ email: 'a@b.com', given_name: 'A', family_name: 'B' }),
			providers: {
				owner: { issuer: 'https://owner.only' },
			},
		};

		const p = resolveProviderConfig(cfg);
		expect(p.issuer).toBe('https://owner.only');
	});

	it('falls back to legacy baseUrl when no providers map provided', () => {
		const cfg: MockOAuth2ServerConfig = {
			port: 0,
			baseUrl: 'http://legacy.example',
			allowedRedirectUris: new Set(['https://app.local/cb']),
			allowedRedirectUri: 'https://app.local/cb',
			redirectUriToAudience: new Map([['https://app.local/cb', 'cid']]),
			getUserProfile: () => ({ email: 'a@b.com', given_name: 'A', family_name: 'B' }),
		};

		const p = resolveProviderConfig(cfg);
		expect(p.issuer).toBe('http://legacy.example');
	});

	it('throws when multiple providers present and no provider specified', () => {
		const cfg: MockOAuth2ServerConfig = {
			port: 0,
			allowedRedirectUris: new Set(['https://app.local/cb']),
			allowedRedirectUri: 'https://app.local/cb',
			redirectUriToAudience: new Map([['https://app.local/cb', 'cid']]),
			getUserProfile: () => ({ email: 'a@b.com', given_name: 'A', family_name: 'B' }),
			providers: {
				one: { issuer: 'https://one' },
				two: { issuer: 'https://two' },
			},
		};

		expect(() => resolveProviderConfig(cfg)).toThrow('multiple_providers_no_default');
	});

	it('throws provider_not_found when named provider missing', () => {
		const cfg: MockOAuth2ServerConfig = {
			port: 0,
			allowedRedirectUris: new Set(['https://app.local/cb']),
			allowedRedirectUri: 'https://app.local/cb',
			redirectUriToAudience: new Map([['https://app.local/cb', 'cid']]),
			getUserProfile: () => ({ email: 'a@b.com', given_name: 'A', family_name: 'B' }),
			providers: {
				one: { issuer: 'https://one' },
			},
		};

		expect(() => resolveProviderConfig(cfg, 'missing')).toThrow('provider_not_found:missing');
	});
});
