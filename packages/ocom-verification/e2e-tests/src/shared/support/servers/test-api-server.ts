import { appPaths } from './app-paths.ts';
import { PortlessServer } from './portless-server.ts';
import { buildUrl, getHostnames, getMongoConnectionString } from './test-environment.ts';

const hostnames = getHostnames();

/**
 * Spawns the api dev server the same way `pnpm dev:worktree` does. The
 * Azure Functions runtime reads deploy/local.settings.json, which is generated
 * from the committed e2e local settings plus runtime-only test values.
 */
export class TestApiServer extends PortlessServer {
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
		return ['run', 'dev:e2e'];
	}
	protected get cwd() {
		return appPaths.apiDir;
	}

	protected override get extraEnv() {
		return {
			COSMOSDB_CONNECTION_STRING: getMongoConnectionString(),
		};
	}

	getUrl(): string {
		return buildUrl(hostnames.api, '/api/graphql');
	}
}
