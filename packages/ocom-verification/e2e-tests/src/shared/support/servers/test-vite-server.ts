import { apiSettings } from '@ocom-verification/verification-shared/settings';
import { PortlessServer } from './portless-server.ts';
import { buildUrl } from './test-environment.ts';

export class TestViteServer extends PortlessServer {
	protected get probeUrl() {
		return buildUrl('ownercommunity.localhost');
	}
	protected get readyMarker() {
		return 'ready in';
	}
	protected get serverName() {
		return 'TestViteServer';
	}
	protected get startupTimeoutMs() {
		return 60_000;
	}
	protected get spawnArgs() {
		return ['ownercommunity.localhost', 'pnpm', 'exec', 'vite'];
	}
	protected get cwd() {
		return apiSettings.uiDir;
	}

	protected override get extraEnv() {
		const oauthAuthority = buildUrl('mock-auth.ownercommunity.localhost');
		const uiBase = buildUrl('ownercommunity.localhost');
		const apiEndpoint = buildUrl('data-access.ownercommunity.localhost', '/api/graphql');

		return {
			BROWSER: 'none',
			VITE_BASE_URL: uiBase,
			VITE_AAD_B2C_ACCOUNT_AUTHORITY: oauthAuthority,
			VITE_AAD_B2C_REDIRECT_URI: `${uiBase}/auth-redirect`,
			VITE_FUNCTION_ENDPOINT: apiEndpoint,
		};
	}

	getUrl(): string {
		return buildUrl('ownercommunity.localhost');
	}
}
