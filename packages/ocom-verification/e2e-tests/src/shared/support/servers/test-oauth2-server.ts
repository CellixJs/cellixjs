import { apiSettings } from '@ocom-verification/verification-shared/settings';
import { PortlessServer } from './portless-server.ts';
import { getHostnames, mockOidcEndpoint, mockOidcIssuer } from './test-environment.ts';

const hostnames = getHostnames();

/**
 * Starts the mock OAuth2/OIDC server via portless.
 *
 * Login is performed by the browser context in oauth2-login.ts rather than
 * by programmatic token generation — this tests the real OIDC redirect flow.
 */
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
		return [hostnames.mockAuth, 'node', 'start-dev.mjs'];
	}
	protected get cwd() {
		return apiSettings.oauth2MockDir;
	}

	getUrl(): string {
		return mockOidcIssuer;
	}
}
