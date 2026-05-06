import { apiSettings } from '@ocom-verification/verification-shared/settings';
import { PortlessServer } from './portless-server.ts';
import { buildUrl, getMongoConnectionString } from './test-environment.ts';

export class TestApiServer extends PortlessServer {
	protected get probeUrl() {
		return buildUrl('data-access.ownercommunity.localhost', '/api/graphql');
	}
	protected override get probeRequestInit(): RequestInit {
		return {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query: '{ __typename }' }),
		};
	}
	protected override async isProbeHealthy(response: Response): Promise<boolean> {
		if (!response.ok) {
			return false;
		}

		const payload = (await response.json().catch(() => null)) as {
			data?: { __typename?: string };
			errors?: unknown[];
		} | null;

		return payload?.data?.__typename === 'Query' && !payload.errors?.length;
	}
	protected get readyMarker() {
		return 'Functions:';
	}
	protected get serverName() {
		return 'TestApiServer';
	}

	protected get spawnArgs() {
		return ['run', 'dev'];
	}
	protected get cwd() {
		return apiSettings.apiDir;
	}

	protected override get extraEnv() {
		return {
			languageWorkers__node__arguments: '',
			COSMOSDB_CONNECTION_STRING: getMongoConnectionString(),
			ACCOUNT_PORTAL_OIDC_ISSUER: apiSettings.accountPortalOidcIssuer,
			ACCOUNT_PORTAL_OIDC_ENDPOINT: apiSettings.accountPortalOidcEndpoint,
			ACCOUNT_PORTAL_OIDC_IGNORE_ISSUER: 'true',
			STAFF_PORTAL_OIDC_ISSUER: apiSettings.accountPortalOidcIssuer,
			STAFF_PORTAL_OIDC_ENDPOINT: apiSettings.accountPortalOidcEndpoint,
			STAFF_PORTAL_OIDC_AUDIENCE: apiSettings.accountPortalOidcAudience,
			STAFF_PORTAL_OIDC_IGNORE_ISSUER: 'true',
			VITE_FUNCTION_ENDPOINT: buildUrl('data-access.ownercommunity.localhost', '/api/graphql'),
		};
	}

	getUrl(): string {
		return buildUrl('data-access.ownercommunity.localhost', '/api/graphql');
	}
}
