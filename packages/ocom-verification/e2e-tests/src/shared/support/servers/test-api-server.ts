import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { apiSettings } from '@ocom-verification/verification-shared/settings';
import { spawnEnv } from './e2e-defaults.ts';
import { PortlessServer } from './portless-server.ts';
import { buildUrl, getHostnames, getMongoConnectionString } from './test-environment.ts';

const hostnames = getHostnames();

/**
 * Spawns the api dev server the same way `pnpm dev:worktree` does. The
 * worktree-aware overrides (OIDC URLs, Azurite connection, etc.) all come
 * from apps/api/start-dev.mjs — we only inject the dynamic MongoDB
 * connection string from MongoMemoryServer here.
 */
export class TestApiServer extends PortlessServer {
	override async start(): Promise<void> {
		// Mirror the `predev:worktree` lifecycle hook so deploy/ and local.settings.json
		// stay in sync — start-dev.mjs is invoked directly here, bypassing pnpm's pre-hook.
		execFileSync('pnpm', ['run', 'predev:worktree'], {
			cwd: this.cwd,
			env: spawnEnv(),
			stdio: 'pipe',
		});

		// Patch deploy/local.settings.json with e2e-specific values.
		// Azure Functions loads local.settings.json values into the worker env,
		// overriding any parent-process env vars. We must patch the file so the
		// worker gets the MongoMemoryServer connection string (random port) and
		// the inspector is disabled (port 5858 may already be in use).
		const settingsPath = join(this.cwd, 'deploy', 'local.settings.json');
		try {
			const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
			settings.Values.COSMOSDB_CONNECTION_STRING = getMongoConnectionString();
			settings.Values['languageWorkers__node__arguments'] = '';
			writeFileSync(settingsPath, JSON.stringify(settings, null, '\t'));
		} catch {
			/* best-effort — file may not exist in CI */
		}

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
		// start-dev.mjs handles the rest via WORKTREE_NAME + `??=` fallbacks.
		return {
			COSMOSDB_CONNECTION_STRING: getMongoConnectionString(),
		};
	}

	getUrl(): string {
		return buildUrl(hostnames.api, '/api/graphql');
	}
}
