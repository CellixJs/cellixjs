import { apiSettings } from '@ocom-verification/verification-shared/settings';
import { PortlessServer } from './portless-server.ts';
import { buildUrl } from './test-environment.ts';

/**
 * Starts the community (user) portal Vite dev server as a subprocess via `pnpm run dev`.
 * This is for the owner-community UI only; a separate server class will be needed for the staff portal.
 */
export class TestCommunityViteServer extends PortlessServer {
	protected get probeUrl() {
		return buildUrl('ownercommunity.localhost');
	}
	protected get readyMarker() {
		return 'ready in';
	}
	protected get serverName() {
		return 'TestCommunityViteServer';
	}
	protected get startupTimeoutMs() {
		return 60_000;
	}
	protected get spawnArgs() {
		return ['run', 'dev'];
	}
	protected get cwd() {
		return apiSettings.uiCommunityDir;
	}

	protected override get extraEnv() {
		const uiBase = buildUrl('ownercommunity.localhost');
		const apiEndpoint = buildUrl('data-access.ownercommunity.localhost', '/api/graphql');

		return {
			BROWSER: 'none',
			VITE_BASE_URL: uiBase,
			VITE_AAD_B2C_ACCOUNT_AUTHORITY: apiSettings.accountPortalOidcIssuer,
			VITE_AAD_B2C_REDIRECT_URI: `${uiBase}/auth-redirect`,
			VITE_FUNCTION_ENDPOINT: apiEndpoint,
		};
	}

	getUrl(): string {
		return buildUrl('ownercommunity.localhost');
	}
}
