import { apiSettings } from '@ocom-verification/verification-shared/settings';
import { PortlessServer } from './portless-server.ts';
import { buildUrl } from './test-environment.ts';

export class TestStaffViteServer extends PortlessServer {
	protected get probeUrl() {
		return buildUrl('staff.ownercommunity.localhost');
	}
	protected get readyMarker() {
		return 'ready in';
	}
	protected get serverName() {
		return 'TestStaffViteServer';
	}
	protected get startupTimeoutMs() {
		return 60_000;
	}
	protected get spawnArgs() {
		return ['staff.ownercommunity.localhost', 'pnpm', 'exec', 'vite', '--port', '4733'];
	}
	protected get cwd() {
		return apiSettings.uiStaffDir;
	}

	protected override get extraEnv() {
		const uiBase = buildUrl('staff.ownercommunity.localhost');
		const apiEndpoint = buildUrl('data-access.ownercommunity.localhost', '/api/graphql');

		return {
			BROWSER: 'none',
			VITE_BASE_URL: uiBase,
			VITE_APP_UI_STAFF_AAD_AUTHORITY: `${apiSettings.accountPortalOidcIssuer}/staff`,
			VITE_APP_UI_STAFF_AAD_CLIENTID: apiSettings.accountPortalOidcAudience,
			VITE_APP_UI_STAFF_AAD_REDIRECT_URI: `${uiBase}/auth-redirect`,
			VITE_COMMON_API_ENDPOINT: apiEndpoint,
		};
	}

	getUrl(): string {
		return buildUrl('staff.ownercommunity.localhost');
	}
}
