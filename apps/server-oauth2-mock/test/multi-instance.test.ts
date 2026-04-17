import { startMockOAuth2Server } from '@cellix/server-oauth2-mock-seedwork';
import { describe, expect, it } from 'vitest';
import { parseConfigs } from '../src/config2';

async function fetchJson(url: string) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Request failed: ${res.status}`);
	return res.json();
}

describe('integration: multiple instances', async () => {
	it('starts two instances and serves openid-configuration', async () => {
		const arr = [
			{ name: 'one', port: 6011, baseUrl: 'http://localhost:6011', allowedRedirectUri: 'http://localhost:6011/redirect', clientId: 'c1' },
			{ name: 'two', port: 6012, baseUrl: 'http://localhost:6012', allowedRedirectUri: 'http://localhost:6012/redirect', clientId: 'c2' },
		];
		const env = { OIDC_CONFIGS: JSON.stringify(arr) };
		const configs = parseConfigs(env as unknown as Record<string, string>);

		const handles = [] as Array<{ disposer: { stop: () => Promise<void> } }>;
		try {
			for (const cfg of configs) {
				const h = await startMockOAuth2Server(cfg as any);
				handles.push(h);
			}

			for (let i = 0; i < configs.length; i++) {
				const cfg = configs[i];
				const url = `${cfg.baseUrl}/.well-known/openid-configuration`;
				const json = await fetchJson(url);
				expect(json.issuer).toBe(cfg.baseUrl);
				expect(json.jwks_uri).toBe(`${cfg.baseUrl}/.well-known/jwks.json`);
			}
		} finally {
			await Promise.all(handles.map((h) => h.disposer.stop()));
		}
	}, 20000);
});
