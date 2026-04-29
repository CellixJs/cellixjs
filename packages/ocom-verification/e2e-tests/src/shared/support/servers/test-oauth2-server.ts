import { apiSettings } from '@ocom-verification/verification-shared/settings';
import { PortlessServer } from './portless-server.ts';
import { buildUrl } from './test-environment.ts';

export class TestOAuth2Server extends PortlessServer {
	protected get probeUrl() {
		return `${buildUrl('mock-auth.ownercommunity.localhost')}/.well-known/jwks.json`;
	}
	protected get readyMarker() {
		return 'Mock OAuth2 server running';
	}
	protected get serverName() {
		return 'TestOAuth2Server';
	}
	protected get startupTimeoutMs() {
		return 30_000;
	}
	protected get spawnArgs() {
		return ['mock-auth.ownercommunity.localhost', 'pnpm', 'exec', 'tsx', 'src/index.ts'];
	}
	protected get cwd() {
		return apiSettings.oauth2MockDir;
	}

	private readonly testUser: {
		email: string;
		given_name: string;
		family_name: string;
	};

	constructor(options?: {
		testUser?: {
			email?: string;
			given_name?: string;
			family_name?: string;
		};
	}) {
		super();
		this.testUser = {
			email: options?.testUser?.email ?? 'alice@test.cellix.local',
			given_name: options?.testUser?.given_name ?? 'Alice',
			family_name: options?.testUser?.family_name ?? 'Test',
		};
	}

	protected override get extraEnv() {
		return {
			EMAIL: this.testUser.email,
			GIVEN_NAME: this.testUser.given_name,
			FAMILY_NAME: this.testUser.family_name,
			BASE_URL: buildUrl('mock-auth.ownercommunity.localhost'),
			ALLOWED_REDIRECT_URI: buildUrl('ownercommunity.localhost', '/auth-redirect'),
			CLIENT_ID: apiSettings.accountPortalOidcAudience,
		};
	}

	getUrl(): string {
		return buildUrl('mock-auth.ownercommunity.localhost');
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
