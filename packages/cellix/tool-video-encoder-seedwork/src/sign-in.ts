import * as client from 'openid-client';
import { listenForLoopbackRedirect } from './loopback-redirect.ts';

export interface SignInOptions {
	/** OIDC issuer, for example `https://login.microsoftonline.com/<tenant>/v2.0` or the local mock issuer. */
	issuer: string;
	clientId: string;
	/** Requested scopes, for example `openid profile api://<api-app-id>/user_impersonation`. */
	scope: string;
	/** Opens the authorization URL in the user's browser. */
	openUrl: (url: string) => Promise<void> | void;
	/** How long to wait for the user to finish signing in. Defaults to 5 minutes. */
	timeoutMs?: number;
	/** Allow plain-http issuers. Only for tests against an in-process mock server. */
	allowInsecureRequests?: boolean;
}

export interface SignInResult {
	accessToken: string;
	expiresAt: Date;
	/** Present when the issuer grants one (Entra ID does when `offline_access` is requested). */
	refreshToken?: string;
	/** Claims from the ID token, such as `name`, `email`, and `roles`. */
	claims: Record<string, unknown>;
}

/**
 * Signs in through the system browser using authorization code + PKCE with a
 * loopback redirect (RFC 8252), the standard flow for CLIs and desktop apps.
 * A temporary listener on `127.0.0.1` receives the redirect and is closed as
 * soon as the code arrives.
 */
export async function signInWithBrowser(options: SignInOptions): Promise<SignInResult> {
	const config = await discover(options);
	const codeVerifier = client.randomPKCECodeVerifier();
	const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
	const state = client.randomState();
	const nonce = client.randomNonce();

	const loopback = await listenForLoopbackRedirect(options.timeoutMs ?? 5 * 60 * 1000);
	const { redirectUri } = loopback;

	try {
		const authorizationUrl = client.buildAuthorizationUrl(config, {
			redirect_uri: redirectUri,
			scope: options.scope,
			code_challenge: codeChallenge,
			code_challenge_method: 'S256',
			state,
			nonce,
		});
		await options.openUrl(authorizationUrl.href);

		const callbackUrl = await loopback.callback;
		const tokens = await client.authorizationCodeGrant(
			config,
			new URL(`${redirectUri}${callbackUrl.search}`),
			{ pkceCodeVerifier: codeVerifier, expectedState: state, expectedNonce: nonce, idTokenExpected: true },
			{ redirect_uri: redirectUri },
		);
		return { ...toResult(tokens), claims: { ...tokens.claims() } };
	} finally {
		loopback.close();
	}
}

export type RefreshSignInOptions = Pick<SignInOptions, 'issuer' | 'clientId' | 'allowInsecureRequests'> & {
	refreshToken: string;
	/** Claims from the original sign-in, kept when the issuer returns no new ID token. */
	claims: Record<string, unknown>;
};

/**
 * Gets a new access token with a refresh token, without opening the browser.
 *
 * @throws When the issuer rejects the refresh token, for example after it
 * expires or is revoked. Sign in with {@link signInWithBrowser} again.
 */
export async function refreshSignIn(options: RefreshSignInOptions): Promise<SignInResult> {
	const tokens = await client.refreshTokenGrant(await discover(options), options.refreshToken);
	const result = toResult(tokens);
	return {
		...result,
		// Keep the old refresh token when the issuer does not rotate it.
		refreshToken: result.refreshToken ?? options.refreshToken,
		claims: tokens.id_token ? { ...tokens.claims() } : options.claims,
	};
}

function discover(options: Pick<SignInOptions, 'issuer' | 'clientId' | 'allowInsecureRequests'>): Promise<client.Configuration> {
	return client.discovery(new URL(options.issuer), options.clientId, undefined, client.None(), options.allowInsecureRequests ? { execute: [client.allowInsecureRequests] } : undefined);
}

function toResult(tokens: client.TokenEndpointResponse): Omit<SignInResult, 'claims'> {
	return {
		accessToken: tokens.access_token,
		expiresAt: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000),
		...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
	};
}
