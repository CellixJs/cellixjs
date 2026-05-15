import { execFileSync } from 'node:child_process';
import { apiSettings } from '@ocom-verification/verification-shared/settings';
import { PortlessServer } from './portless-server.ts';
import { buildUrl, getMongoConnectionString, mockOidcAudience, mockOidcEndpoint, mockOidcIssuer } from './test-environment.ts';

export class TestApiServer extends PortlessServer {
	override async start(): Promise<void> {
		// Mirror the app's real dev bootstrap so deploy assets and local settings
		// stay in sync with recent package-script changes.
		const env = {
			...process.env,
		};
		delete env.NODE_OPTIONS;

		execFileSync('pnpm', ['run', 'predev'], {
			cwd: this.cwd,
			env,
			stdio: 'pipe',
		});

		await super.start();
	}

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
			// Force dev mode so OtelBuilder uses console exporters and doesn't
			// require APPLICATIONINSIGHTS_CONNECTION_STRING. CI agents may
			// inherit NODE_ENV=production from pipeline variable groups, which
			// causes the bundled entry point to throw at module load and func
			// to register zero functions ("No job functions found"), surfacing
			// as a 404 on /api/graphql even though the host is alive.
			NODE_ENV: 'development',
			languageWorkers__node__arguments: '',
			COSMOSDB_CONNECTION_STRING: getMongoConnectionString(),
			COSMOSDB_DBNAME: apiSettings.cosmosDbName,
			// AZURE_STORAGE_CONNECTION_STRING is required by ServiceBlobStorage
			// at appStart. Locally set via gitignored local.settings.json; absent
			// in CI without this override.
			AZURE_STORAGE_CONNECTION_STRING: 'UseDevelopmentStorage=true',
			ACCOUNT_PORTAL_OIDC_ISSUER: mockOidcIssuer,
			ACCOUNT_PORTAL_OIDC_ENDPOINT: mockOidcEndpoint,
			ACCOUNT_PORTAL_OIDC_AUDIENCE: mockOidcAudience,
			ACCOUNT_PORTAL_OIDC_IGNORE_ISSUER: 'true',
			STAFF_PORTAL_OIDC_ISSUER: mockOidcIssuer,
			STAFF_PORTAL_OIDC_ENDPOINT: mockOidcEndpoint,
			STAFF_PORTAL_OIDC_AUDIENCE: mockOidcAudience,
			STAFF_PORTAL_OIDC_IGNORE_ISSUER: 'true',
			VITE_COMMON_API_ENDPOINT: buildUrl('data-access.ownercommunity.localhost', '/api/graphql'),
		};
	}

	getUrl(): string {
		return buildUrl('data-access.ownercommunity.localhost', '/api/graphql');
	}
}
