import { appPaths } from './app-paths.ts';
import { getPortlessDevScript } from './dev-script.ts';
import { PortlessServer } from './portless-server.ts';
import { mockOidcEndpoint, mockOidcIssuer } from './test-environment.ts';

/**
 * Starts the mock OAuth2/OIDC server via portless.
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

	protected override get executable() {
		return 'pnpm';
	}

	protected get spawnArgs() {
		return ['run', getPortlessDevScript()];
	}

	protected get cwd() {
		return appPaths.oauth2MockDir;
	}

	getUrl(): string {
		return mockOidcIssuer;
	}
}
