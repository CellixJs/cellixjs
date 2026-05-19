import { execFileSync } from 'node:child_process';
import { apiSettings } from '@ocom-verification/verification-shared/settings';
import { PortlessServer } from './portless-server.ts';
import { buildUrl, getHostnames, getMongoConnectionString, mockOidcAudience, mockOidcEndpoint, mockOidcIssuer } from './test-environment.ts';

const hostnames = getHostnames();

export class TestApiServer extends PortlessServer {
	override async start(): Promise<void> {
		// Mirror the app's real dev bootstrap so deploy assets and local settings
		// stay in sync with recent package-script changes.
		const env = {
			...process.env,
		};
		delete env['NODE_OPTIONS'];

		execFileSync('pnpm', ['run', 'predev'], {
			cwd: this.cwd,
			env,
			stdio: 'pipe',
		});

		await super.start();
	}

	protected get probeUrl() {
		return buildUrl(hostnames.api, '/api/graphql');
	}

	protected override get probeRequestInit(): RequestInit {
		return {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query: '{ __typename }' }),
		};
	}

	protected override async isProbeHealthy(response: Response): Promise<boolean> {
		if (!response.ok) return false;
		try {
			const data = (await response.json()) as { data?: { __typename?: string } };
			return data?.data?.__typename === 'Query';
		} catch {
			return false;
		}
	}

	protected get readyMarker() {
		return 'Functions:';
	}
	protected get serverName() {
		return 'TestApiServer';
	}
	protected get spawnArgs() {
		return [hostnames.api, 'node', 'start-dev.mjs'];
	}
	protected get cwd() {
		return apiSettings.apiDir;
	}

	protected override get extraEnv() {
		return {
			NODE_ENV: 'development',
			languageWorkers__node__arguments: '',
			COSMOSDB_CONNECTION_STRING: getMongoConnectionString(),
			COSMOSDB_DBNAME: apiSettings.cosmosDbName,
			AZURE_STORAGE_CONNECTION_STRING: 'UseDevelopmentStorage=true',
			ACCOUNT_PORTAL_OIDC_ISSUER: mockOidcIssuer,
			ACCOUNT_PORTAL_OIDC_ENDPOINT: mockOidcEndpoint,
			ACCOUNT_PORTAL_OIDC_AUDIENCE: mockOidcAudience,
			ACCOUNT_PORTAL_OIDC_IGNORE_ISSUER: 'true',
			STAFF_PORTAL_OIDC_ISSUER: mockOidcIssuer,
			STAFF_PORTAL_OIDC_ENDPOINT: mockOidcEndpoint,
			STAFF_PORTAL_OIDC_AUDIENCE: mockOidcAudience,
			STAFF_PORTAL_OIDC_IGNORE_ISSUER: 'true',
			VITE_COMMON_API_ENDPOINT: buildUrl(hostnames.api, '/api/graphql'),
		};
	}

	getUrl(): string {
		return buildUrl(hostnames.api, '/api/graphql');
	}
}
