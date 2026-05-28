import { appPaths } from './app-paths.ts';
import { e2eEnv, getPortlessDevScript } from './dev-script.ts';
import { PortlessServer } from './portless-server.ts';
import { buildUrl, getHostnames, getMongoConnectionString } from './test-environment.ts';

const hostnames = getHostnames();

/**
 * Spawns the api e2e dev server through the PR's portless/worktree path.
 */
export class TestApiServer extends PortlessServer {
	protected get probeUrl() {
		return this.getUrl();
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

	protected override get executable() {
		return 'pnpm';
	}

	protected get spawnArgs() {
		return ['run', getPortlessDevScript()];
	}

	protected get cwd() {
		return appPaths.apiDir;
	}

	protected override get extraEnv() {
		return e2eEnv({
			COSMOSDB_CONNECTION_STRING: getMongoConnectionString(),
		});
	}

	getUrl(): string {
		return buildUrl(hostnames.api, '/api/graphql');
	}
}
