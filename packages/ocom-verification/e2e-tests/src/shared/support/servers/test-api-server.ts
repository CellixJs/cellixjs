import { apiSettings } from '@ocom-verification/verification-shared/settings';
import { PortlessServer } from './portless-server.ts';
import { buildUrl, getMongoConnectionString } from './test-environment.ts';

export class TestApiServer extends PortlessServer {
	protected get probeUrl() {
		return buildUrl('data-access.ownercommunity.localhost', '/api/graphql');
	}
	protected get readyMarker() {
		return 'Functions:';
	}
	protected get serverName() {
		return 'TestApiServer';
	}
	protected get startupTimeoutMs() {
		return 120_000;
	}
	protected get spawnArgs() {
		return ['data-access.ownercommunity.localhost', 'node', 'start-dev.mjs'];
	}
	protected get cwd() {
		return apiSettings.apiDir;
	}

	protected override get extraEnv() {
		const oauthUrl = buildUrl('mock-auth.ownercommunity.localhost');
		return {
			languageWorkers__node__arguments: '',
			COSMOSDB_CONNECTION_STRING: getMongoConnectionString(),
			ACCOUNT_PORTAL_OIDC_ISSUER: oauthUrl,
			ACCOUNT_PORTAL_OIDC_ENDPOINT: `${oauthUrl}/.well-known/jwks.json`,
			VITE_FUNCTION_ENDPOINT: buildUrl('data-access.ownercommunity.localhost', '/api/graphql'),
		};
	}

	getUrl(): string {
		return buildUrl('data-access.ownercommunity.localhost', '/api/graphql');
	}
}
