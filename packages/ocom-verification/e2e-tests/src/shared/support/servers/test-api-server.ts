import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { apiSettings } from '@ocom-verification/verification-shared/settings';
import { PortlessServer } from './portless-server.ts';
import { buildUrl, getMongoConnectionString, mockOidcAudience, mockOidcEndpoint, mockOidcIssuer } from './test-environment.ts';

export class TestApiServer extends PortlessServer {
	override async start(): Promise<void> {
		const env = {
			...process.env,
		};
		// biome-ignore lint:useLiteralKeys
		delete env['NODE_OPTIONS'];

		execFileSync('pnpm', ['run', 'predev'], {
			cwd: this.cwd,
			env,
			stdio: 'pipe',
		});

		this.writeDeployLocalSettings();
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
			NODE_TLS_REJECT_UNAUTHORIZED: '0',
			languageWorkers__node__arguments: '',
			COSMOSDB_CONNECTION_STRING: getMongoConnectionString(),
			COSMOSDB_DBNAME: apiSettings.cosmosDbName,
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

	private writeDeployLocalSettings(): void {
		const sourcePath = resolve(this.cwd, 'local.settings.json');
		const targetDir = resolve(this.cwd, 'deploy');
		const targetPath = resolve(targetDir, 'local.settings.json');
		const settings = (
			existsSync(sourcePath)
				? (JSON.parse(readFileSync(sourcePath, 'utf8')) as {
						Values?: Record<string, string | boolean>;
					})
				: {
						IsEncrypted: false,
						Values: {},
					}
		) as {
			IsEncrypted?: boolean;
			Values?: Record<string, string | boolean>;
		};

		settings.Values ??= {};
		applyEnvOverride(settings.Values, 'AZURE_STORAGE_ACCOUNT_NAME');
		applyEnvOverride(settings.Values, 'AZURE_STORAGE_CONNECTION_STRING');
		applyEnvOverride(settings.Values, 'COSMOSDB_CONNECTION_STRING');
		applyEnvOverride(settings.Values, 'COSMOSDB_DBNAME');
		applyEnvOverride(settings.Values, 'ACCOUNT_PORTAL_OIDC_ISSUER');
		applyEnvOverride(settings.Values, 'ACCOUNT_PORTAL_OIDC_ENDPOINT');
		applyEnvOverride(settings.Values, 'ACCOUNT_PORTAL_OIDC_AUDIENCE');
		applyEnvOverride(settings.Values, 'ACCOUNT_PORTAL_OIDC_IGNORE_ISSUER');
		applyEnvOverride(settings.Values, 'STAFF_PORTAL_OIDC_ISSUER');
		applyEnvOverride(settings.Values, 'STAFF_PORTAL_OIDC_ENDPOINT');
		applyEnvOverride(settings.Values, 'STAFF_PORTAL_OIDC_AUDIENCE');
		applyEnvOverride(settings.Values, 'STAFF_PORTAL_OIDC_IGNORE_ISSUER');
		applyEnvOverride(settings.Values, 'NODE_ENV');
		applyEnvOverride(settings.Values, 'languageWorkers__node__arguments');

		mkdirSync(targetDir, { recursive: true });
		writeFileSync(targetPath, `${JSON.stringify(settings, null, '\t')}\n`, 'utf8');
	}
}

function applyEnvOverride(target: Record<string, string | boolean>, key: string): void {
	const value = process.env[key];
	if (value === undefined) {
		return;
	}

	target[key] = value;
}
