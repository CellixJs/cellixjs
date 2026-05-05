import { execFileSync } from 'node:child_process';
import { apiSettings } from '@ocom-verification/verification-shared/settings';
import { PortlessServer } from './portless-server.ts';
import { buildUrl, getMongoConnectionString } from './test-environment.ts';

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
		return {
			languageWorkers__node__arguments: '',
			COSMOSDB_CONNECTION_STRING: getMongoConnectionString(),
			ACCOUNT_PORTAL_OIDC_ISSUER: apiSettings.accountPortalOidcIssuer,
			ACCOUNT_PORTAL_OIDC_ENDPOINT: apiSettings.accountPortalOidcEndpoint,
			VITE_FUNCTION_ENDPOINT: buildUrl('data-access.ownercommunity.localhost', '/api/graphql'),
		};
	}

	getUrl(): string {
		return buildUrl('data-access.ownercommunity.localhost', '/api/graphql');
	}
}
