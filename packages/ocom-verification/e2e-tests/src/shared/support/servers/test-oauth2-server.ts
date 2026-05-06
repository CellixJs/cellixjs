import { apiSettings } from '@ocom-verification/verification-shared/settings';
import { PortlessServer } from './portless-server.ts';
import { buildUrl } from './test-environment.ts';

export class TestOAuth2Server extends PortlessServer {
	protected get probeUrl() {
		return apiSettings.accountPortalOidcEndpoint;
	}
	protected get readyMarker() {
		return 'Registered OIDC config';
	}
	protected get serverName() {
		return 'TestOAuth2Server';
	}

	/**
	 * OAuth2 mock server is lightweight and starts very quickly.
	 * Using a short timeout (30s vs default 120s) for faster feedback.
	 */
	protected override get startupTimeoutMs() {
		return 30_000;
	}

	protected get spawnArgs() {
		return ['run', 'dev'];
	}
	protected get cwd() {
		return apiSettings.oauth2MockDir;
	}

	getUrl(): string {
		return apiSettings.accountPortalOidcIssuer;
	}

	async generateAccessToken(_audience = 'mock-client'): Promise<string> {
		const issuer = this.getUrl();
		const uiBaseUrl = buildUrl('ownercommunity.localhost');
		const redirectUri = `${uiBaseUrl}/auth-redirect`;

		const code = `mock-auth-code-${Buffer.from(redirectUri).toString('base64')}`;

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
