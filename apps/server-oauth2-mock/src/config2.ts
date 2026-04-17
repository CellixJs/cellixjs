import type { MockOAuth2ServerConfig, MockOAuth2UserProfile } from '@cellix/server-oauth2-mock-seedwork';

export interface NamedConfig extends MockOAuth2ServerConfig {
	name?: string;
}

function parseJsonArray(value: string) {
	try {
		const parsed = JSON.parse(value);
		if (!Array.isArray(parsed)) throw new Error('OIDC_CONFIGS must be a JSON array');
		return parsed as unknown[];
	} catch (err: unknown) {
		throw new Error(`Failed to parse OIDC_CONFIGS: ${(err as Error).message}`);
	}
}

export function parseConfigs(env = process.env): NamedConfig[] {
	const raw = env.OIDC_CONFIGS;
	if (raw) {
		const arr = parseJsonArray(raw);
		if (arr.length === 0) throw new Error('OIDC_CONFIGS must contain at least one configuration object');
		return arr.map((entry, idx) => {
			if (typeof entry !== 'object' || entry === null) throw new Error(`OIDC_CONFIGS[${idx}] must be an object`);
			const e = entry as Record<string, unknown>;
			const name = typeof e.name === 'string' ? (e.name as string) : `config${idx + 1}`;

			const rawPort = typeof e.port === 'number' ? (e.port as number) : typeof e.port === 'string' ? Number(e.port) : undefined;
			const port = Number.isFinite(rawPort as number) ? Number(rawPort) : undefined;

			const clientId = typeof e.clientId === 'string' ? (e.clientId as string) : typeof e.CLIENT_ID === 'string' ? (e.CLIENT_ID as string) : (env.CLIENT_ID ?? 'mock-client');
			const allowedRedirectUri =
				typeof e.allowedRedirectUri === 'string'
					? (e.allowedRedirectUri as string)
					: typeof e.ALLOWED_REDIRECT_URI === 'string'
						? (e.ALLOWED_REDIRECT_URI as string)
						: (env.ALLOWED_REDIRECT_URI ?? 'https://ownercommunity.localhost/auth-redirect');

			const email = typeof e.email === 'string' ? (e.email as string) : typeof e.EMAIL === 'string' ? (e.EMAIL as string) : (env.EMAIL ?? 'test@example.com');
			const given_name = typeof e.given_name === 'string' ? (e.given_name as string) : typeof e.GIVEN_NAME === 'string' ? (e.GIVEN_NAME as string) : (env.GIVEN_NAME ?? 'Test');
			const family_name = typeof e.family_name === 'string' ? (e.family_name as string) : typeof e.FAMILY_NAME === 'string' ? (e.FAMILY_NAME as string) : (env.FAMILY_NAME ?? 'User');
			const sub = typeof e.sub === 'string' ? (e.sub as string) : typeof e.SUB === 'string' ? (e.SUB as string) : env.SUB;
			const tid = typeof e.tid === 'string' ? (e.tid as string) : typeof e.TID === 'string' ? (e.TID as string) : (env.TID ?? 'test-tenant-id');

			// baseUrl resolution: prefer explicit baseUrl, then BASE_URL, then PORTLESS_URL+port, then build from port+localhost
			const providedBase = typeof e.baseUrl === 'string' ? (e.baseUrl as string) : typeof e.BASE_URL === 'string' ? (e.BASE_URL as string) : undefined;
			let baseUrl: string | undefined = providedBase;
			if (!baseUrl) {
				if (env.PORTLESS_URL && port) baseUrl = `${(env.PORTLESS_URL as string).replace(/\/$/, '')}`;
				else if (env.BASE_URL) baseUrl = (env.BASE_URL as string).replace(/\/$/, '');
				else if (port) baseUrl = `http://localhost:${port}`;
			}
			if (!baseUrl) throw new Error(`OIDC_CONFIGS[${idx}] must include either baseUrl or port`);
			baseUrl = baseUrl.replace(/\/$/, '');

			const host = typeof e.host === 'string' ? (e.host as string) : (env.HOST ?? '127.0.0.1');

			const config: NamedConfig = {
				name,
				port: port ?? Number(env['PORT'] ?? 4000),
				baseUrl,
				host,
				allowedRedirectUris: new Set([allowedRedirectUri]),
				allowedRedirectUri,
				redirectUriToAudience: new Map([[allowedRedirectUri, clientId]]),
				getUserProfile: () => ({ email, given_name, family_name, ...(sub ? { sub } : {}), ...(tid ? { tid } : {}) }) as MockOAuth2UserProfile,
			};
			return config;
		});
	}

	// Fallback to existing single-config behavior
	const PORT = env.PORT;
	const PORTLESS_URL = env.PORTLESS_URL;
	const BASE_URL = env.BASE_URL;
	const ALLOWED_REDIRECT_URI = env.ALLOWED_REDIRECT_URI;
	const CLIENT_ID = env.CLIENT_ID;
	const SUB = env.SUB;
	const TID = env.TID;
	const EMAIL = env.EMAIL;
	const GIVEN_NAME = env.GIVEN_NAME;
	const FAMILY_NAME = env.FAMILY_NAME;
	const HOST = env.HOST;

	const port = Number(PORT ?? 4000);
	const baseUrl = ((PORTLESS_URL ?? BASE_URL ?? `http://localhost:${port}`) as string).replace(/\/$/, '');
	const allowedRedirectUri = ALLOWED_REDIRECT_URI ?? 'https://ownercommunity.localhost/auth-redirect';
	const clientId = CLIENT_ID ?? 'mock-client';

	const userProfile = {
		email: EMAIL ?? 'test@example.com',
		given_name: GIVEN_NAME ?? 'Test',
		family_name: FAMILY_NAME ?? 'User',
		...(SUB ? { sub: SUB } : {}),
		...(TID ? { tid: TID } : {}),
	} as MockOAuth2UserProfile;

	const config: NamedConfig = {
		name: 'default',
		port,
		baseUrl,
		host: HOST ?? '127.0.0.1',
		allowedRedirectUris: new Set([allowedRedirectUri]),
		allowedRedirectUri,
		redirectUriToAudience: new Map([[allowedRedirectUri, clientId]]),
		getUserProfile: () => userProfile,
	};

	return [config];
}
