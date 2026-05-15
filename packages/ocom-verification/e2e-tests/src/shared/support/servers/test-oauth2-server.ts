import { apiSettings } from '@ocom-verification/verification-shared/settings';
import { PortlessServer } from './portless-server.ts';
import { buildUrl, mockOidcEndpoint, mockOidcIssuer } from './test-environment.ts';

export class TestOAuth2Server extends PortlessServer {
	protected get probeUrl() {
		return mockOidcEndpoint;
	}
	protected get readyMarker() {
		return 'Registered OIDC config';
	}
	protected get serverName() {
		return 'TestOAuth2Server';
	}

	protected get spawnArgs() {
		return ['run', 'dev'];
	}
	protected get cwd() {
		return apiSettings.oauth2MockDir;
	}

	getUrl(): string {
		return mockOidcIssuer;
	}

	async generateAccessToken(_audience = 'mock-client'): Promise<string> {
		const issuer = this.getUrl();
		const uiBaseUrl = buildUrl('ownercommunity.localhost');
		const redirectUri = `${uiBaseUrl}/auth-redirect`;

		// Step 1: Hit /authorize to start the OIDC flow.
		const authorizeUrl = new URL(`${issuer}/authorize`);
		authorizeUrl.searchParams.set('redirect_uri', redirectUri);
		authorizeUrl.searchParams.set('response_type', 'code');
		authorizeUrl.searchParams.set('client_id', 'mock-client');

		const authorizeRes = await fetch(authorizeUrl.toString(), { redirect: 'manual' });
		const authorizeLocation = authorizeRes.headers.get('location');
		if (!authorizeLocation) {
			throw new Error(`/authorize did not return a redirect location (status ${authorizeRes.status})`);
		}

		// If the redirect contains a code already (no userStore), use it directly.
		const authorizeRedirect = new URL(authorizeLocation);
		let code = authorizeRedirect.searchParams.get('code');

		if (!code) {
			// Step 2: GET the login page to establish a session and get the sessionNonce.
			const loginPageRes = await fetch(authorizeLocation);
			if (!loginPageRes.ok) {
				throw new Error(`GET /login failed (status ${loginPageRes.status})`);
			}
			const html = await loginPageRes.text();
			const nonceMatch = html.match(/name="nonce"\s+value="([^"]*)"/);
			if (!nonceMatch) {
				throw new Error('Could not extract session nonce from login page HTML');
			}
			const sessionNonce = nonceMatch[1];

			// Step 3: POST credentials to /login with the session nonce.
			const loginRes = await fetch(`${issuer}/login?nonce=${encodeURIComponent(sessionNonce)}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username: 'test@example.com',
					password: 'password',
					nonce: sessionNonce,
				}),
				redirect: 'manual',
			});

			const loginLocation = loginRes.headers.get('location');
			if (!loginLocation) {
				throw new Error(`/login did not return a redirect location (status ${loginRes.status}, body: ${await loginRes.text()})`);
			}

			const loginRedirect = new URL(loginLocation);
			code = loginRedirect.searchParams.get('code');
			if (!code) {
				throw new Error(`/login redirect did not include a code parameter: ${loginLocation}`);
			}
		}

		// Step 4: Exchange the code for an access token
		const response = await fetch(`${issuer}/token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ code, grant_type: 'authorization_code' }),
		});

		if (!response.ok) {
			throw new Error(`Token request failed: ${response.status} ${await response.text()}`);
		}

		const data = (await response.json()) as { access_token: string };
		return data.access_token;
	}
}
