import { appPaths } from './app-paths.ts';
import { PortlessServer } from './portless-server.ts';
import { buildUrl, getHostnames } from './test-environment.ts';

const hostnames = getHostnames();

/**
 * Starts the community portal Vite dev server via portless.
 *
 * The `apps/ui-community/start-dev.mjs` script sets all VITE_* environment
 * variables at runtime using portless-hostnames.mjs, so no extraEnv overrides
 * are needed here beyond suppressing browser auto-launch.
 */
export class TestCommunityViteServer extends PortlessServer {
	protected get readyMarker() {
		return 'ready in';
	}
	protected get serverName() {
		return 'TestCommunityViteServer';
	}
	protected get spawnArgs() {
		return [hostnames.uiCommunity, 'node', 'start-dev.mjs'];
	}
	protected get cwd() {
		return appPaths.uiCommunityDir;
	}
	protected override get extraEnv() {
		return {
			BROWSER: 'none',
			NODE_ENV: 'development',
			E2E_VITE_MODE: 'e2e',
		};
	}

	getUrl(): string {
		return buildUrl(hostnames.uiCommunity);
	}
}
