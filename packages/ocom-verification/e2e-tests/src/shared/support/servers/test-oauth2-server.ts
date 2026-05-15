import { apiSettings } from '@ocom-verification/verification-shared/settings';
import { PortlessServer } from './portless-server.ts';
import { mockOidcEndpoint, mockOidcIssuer } from './test-environment.ts';

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
}
