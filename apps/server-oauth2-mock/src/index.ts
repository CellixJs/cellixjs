import { type MockOAuth2ServerConfig, type OidcProviderConfig, startMockOAuth2Server } from '@cellix/server-oauth2-mock-seedwork';
import { setupEnvironment } from './setup-environment.ts';

setupEnvironment();

const { PORT, PORTLESS_URL, BASE_URL, ALLOWED_REDIRECT_URI, CLIENT_ID, SUB, TID, EMAIL, GIVEN_NAME, FAMILY_NAME, OIDC_PROVIDERS_JSON } = process.env;

const port = Number(PORT ?? 4000);
const baseUrl = (PORTLESS_URL ?? BASE_URL ?? `http://localhost:${port}`).replace(/\/$/, '');
const allowedRedirectUri = ALLOWED_REDIRECT_URI ?? 'https://ownercommunity.localhost/auth-redirect';
const clientId = CLIENT_ID ?? 'mock-client';

const userProfile = {
	email: EMAIL ?? 'test@example.com',
	given_name: GIVEN_NAME ?? 'Test',
	family_name: FAMILY_NAME ?? 'User',
	...(SUB ? { sub: SUB } : {}),
	...(TID ? { tid: TID } : {}),
};

let providers: Record<string, OidcProviderConfig> | undefined;
if (typeof OIDC_PROVIDERS_JSON === 'string' && OIDC_PROVIDERS_JSON.trim().length > 0) {
	try {
		const parsed = JSON.parse(OIDC_PROVIDERS_JSON) as Record<string, OidcProviderConfig>;
		if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
			throw new Error('OIDC_PROVIDERS_JSON must be an object map of providerName->config');
		}
		// basic validation: each provider must have an issuer string
		for (const [k, v] of Object.entries(parsed)) {
			if (!v || typeof v.issuer !== 'string') throw new Error(`provider ${k} missing issuer`);
			// normalize issuer
			v.issuer = v.issuer.replace(/\/$/, '');
			if (!v.jwksUri) v.jwksUri = `${v.issuer}/.well-known/jwks.json`;
		}
		providers = parsed;
		console.log('Loaded OIDC providers:', Object.keys(providers).join(','));
	} catch (err) {
		console.error('Failed to parse OIDC_PROVIDERS_JSON:', err);
		process.exit(1);
	}
}

const config: MockOAuth2ServerConfig = {
	port,
	// keep legacy baseUrl for backwards compatibility; seedwork will prefer providers map when present
	baseUrl,
	host: '127.0.0.1',
	allowedRedirectUris: new Set([allowedRedirectUri]),
	allowedRedirectUri,
	redirectUriToAudience: new Map([[allowedRedirectUri, clientId]]),
	getUserProfile: () => userProfile,
	providers,
};

// Start server and wire disposer into process shutdown handlers
try {
	const { disposer } = await startMockOAuth2Server(config);

	const shutdown = async (signal?: string, exitCode = 0) => {
		try {
			console.log(`Shutting down mock OAuth2 server (${signal ?? 'signal'})`);
			await disposer.stop();
		} catch (err) {
			console.error('Error during mock OAuth2 server shutdown:', err);
		} finally {
			process.exit(exitCode);
		}
	};

	process.once('SIGINT', () => void shutdown('SIGINT'));
	process.once('SIGTERM', () => void shutdown('SIGTERM'));
	process.once('SIGQUIT', () => void shutdown('SIGQUIT'));
	process.once('uncaughtException', async (err) => {
		console.error('Uncaught exception, shutting down:', err);
		await shutdown('uncaughtException', 1);
	});
	process.once('unhandledRejection', async (reason) => {
		console.error('Unhandled rejection, shutting down:', reason);
		await shutdown('unhandledRejection', 1);
	});
} catch (error: unknown) {
	console.error('Failed to start mock OAuth2 server:', error);
	process.exit(1);
}
