import { startMockOAuth2Server, type MockOAuth2ServerConfig } from '@cellix/server-oauth2-mock-seedwork';
import { setupEnvironment } from './setup-environment.ts';

setupEnvironment();

const {
	PORT,
	PORTLESS_URL,
	BASE_URL,
	ALLOWED_REDIRECT_URI,
	CLIENT_ID,
	SUB,
	TID,
	EMAIL,
	GIVEN_NAME,
	FAMILY_NAME,
} = process.env;

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

const config: MockOAuth2ServerConfig = {
	port,
	baseUrl,
	host: '127.0.0.1',
	allowedRedirectUris: new Set([allowedRedirectUri]),
	allowedRedirectUri,
	redirectUriToAudience: new Map([[allowedRedirectUri, clientId]]),
	getUserProfile: () => userProfile,
};

startMockOAuth2Server(config).catch((error: unknown) => {
	console.error('Failed to start mock OAuth2 server:', error);
	process.exit(1);
});
