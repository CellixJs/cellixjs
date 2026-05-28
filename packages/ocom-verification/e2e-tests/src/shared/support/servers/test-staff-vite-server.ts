import { appPaths } from './app-paths.ts';
import { e2eEnv, getPortlessDevScript } from './dev-script.ts';
import { PortlessServer } from './portless-server.ts';
import { buildUrl, getHostnames } from './test-environment.ts';

const hostnames = getHostnames();

/**
 * Starts the staff portal Vite dev server via portless.
 */
export class TestStaffViteServer extends PortlessServer {
	protected get probeUrl() {
		return this.getUrl();
	}

	protected get readyMarker() {
		return 'ready in';
	}

	protected get serverName() {
		return 'TestStaffViteServer';
	}

	protected override get executable() {
		return 'pnpm';
	}

	protected get spawnArgs() {
		return ['run', getPortlessDevScript()];
	}

	protected get cwd() {
		return appPaths.uiStaffDir;
	}

	protected override get extraEnv() {
		return e2eEnv({
			BROWSER: 'none',
			NODE_ENV: 'development',
		});
	}

	getUrl(): string {
		return buildUrl(hostnames.uiStaff);
	}
}
