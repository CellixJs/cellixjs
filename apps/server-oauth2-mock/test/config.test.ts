import { describe, expect, it } from 'vitest';
import { parseConfigs } from '../src/config2';

describe('parseConfigs unit tests', () => {
	it('returns single config when OIDC_CONFIGS not set', () => {
		const env = {
			PORT: '4555',
			BASE_URL: 'http://localhost:4555',
			ALLOWED_REDIRECT_URI: 'http://localhost:4555/redirect',
			CLIENT_ID: 'single-client',
			EMAIL: 'u@example.com',
			GIVEN_NAME: 'U',
			FAMILY_NAME: 'X',
		};

		const configs = parseConfigs(env as unknown as Record<string, string>);
		expect(configs).toHaveLength(1);
		expect(configs[0].baseUrl).toBe('http://localhost:4555');
		expect(configs[0].port).toBe(4555);
	});

	it('parses OIDC_CONFIGS JSON array', () => {
		const arr = [
			{
				name: 'one',
				port: 5601,
				baseUrl: 'http://localhost:5601',
				allowedRedirectUri: 'http://localhost:5601/redirect',
				clientId: 'c1',
				email: 'a@b.com',
				given_name: 'A',
				family_name: 'B',
			},
			{
				name: 'two',
				port: 5602,
				baseUrl: 'http://localhost:5602',
				allowedRedirectUri: 'http://localhost:5602/redirect',
				clientId: 'c2',
				email: 'c@d.com',
				given_name: 'C',
				family_name: 'D',
			},
		];
		const env = { OIDC_CONFIGS: JSON.stringify(arr) };
		const configs = parseConfigs(env as unknown as Record<string, string>);
		expect(configs).toHaveLength(2);
		expect(configs[0].name).toBe('one');
		expect(configs[0].baseUrl).toBe('http://localhost:5601');
		expect(configs[1].name).toBe('two');
	});

	it('throws on malformed JSON', () => {
		const env = { OIDC_CONFIGS: '{bad json' };
		expect(() => parseConfigs(env as unknown as Record<string, string>)).toThrow(/Failed to parse OIDC_CONFIGS/);
	});
});
