import { apiSettings } from '@ocom-verification/verification-shared/settings';
import { PortlessServer } from './portless-server.ts';
import { buildUrl, mockStaffOidcIssuer } from './test-environment.ts';

/**
 * Starts the staff portal Vite dev server as a subprocess via `pnpm run dev`.
 */
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

	protected override get startupTimeoutMs() {
		return 60_000;
	}

	protected get spawnArgs() {
		return ['run', 'dev'];
	}
	protected get cwd() {
		return apiSettings.uiStaffDir;
	}

	protected override get extraEnv() {
		const uiBase = buildUrl('staff.ownercommunity.localhost');
		const apiEndpoint = buildUrl('data-access.ownercommunity.localhost', '/api/graphql');

		return {
			BROWSER: 'none',
			NODE_ENV: 'development',
			VITE_BASE_URL: uiBase,
			VITE_APP_UI_STAFF_AAD_AUTHORITY: mockStaffOidcIssuer,
			VITE_APP_UI_STAFF_AAD_REDIRECT_URI: `${uiBase}/auth-redirect`,
			VITE_APP_UI_STAFF_AAD_CLIENTID: 'mock-client',
			VITE_COMMON_API_ENDPOINT: apiEndpoint,
			VITE_FUNCTION_ENDPOINT: apiEndpoint,
		};
	}

	getUrl(): string {
		return buildUrl('staff.ownercommunity.localhost');
	}
}
