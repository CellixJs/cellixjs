import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
	applyApiLocalSettingsOverrides,
	buildPortlessUrl,
	buildViteArgs,
	getAzuriteConnectionString,
	getAzuritePorts,
	getMongoConnectionString,
	getMongoPort,
	getWorktreePortOffset,
	PORTLESS_PORT,
	resolvePortlessHostnames,
	resolveWorkspaceRoot,
} from '@cellix/local-dev';
import { describe, expect, it } from 'vitest';

function createWorkspaceFixture(): string {
	const root = mkdtempSync(path.join(tmpdir(), 'cellix-local-dev-'));
	writeFileSync(path.join(root, 'pnpm-workspace.yaml'), 'packages:\n  - "apps/*"\n');
	mkdirSync(path.join(root, 'apps', 'ui-community'), { recursive: true });
	mkdirSync(path.join(root, 'apps', 'ui-staff'), { recursive: true });
	mkdirSync(path.join(root, 'apps', 'api'), { recursive: true });

	writeFileSync(
		path.join(root, 'apps', 'ui-community', '.env'),
		[
			'VITE_APP_UI_COMMUNITY_BASE_URL=https://ownercommunity.localhost:1355',
			'VITE_COMMON_API_ENDPOINT=https://data-access.ownercommunity.localhost:1355/api/graphql',
			'VITE_APP_UI_COMMUNITY_B2C_AUTHORITY=https://mock-auth.ownercommunity.localhost:1355/community',
		].join('\n'),
	);
	writeFileSync(path.join(root, 'apps', 'ui-staff', '.env'), 'VITE_APP_UI_STAFF_AAD_REDIRECT_URI=https://staff.ownercommunity.localhost:1355/auth-redirect\n');
	writeFileSync(
		path.join(root, 'apps', 'api', 'local.settings.json'),
		JSON.stringify(
			{
				Values: {
					COSMOSDB_CONNECTION_STRING: 'mongodb://127.0.0.1:50000/test?replicaSet=rs0',
					STORAGE_ACCOUNT_NAME: 'devstoreaccount1',
					STORAGE_ACCOUNT_KEY: 'key',
				},
			},
			null,
			2,
		),
	);

	return root;
}

describe('@cellix/local-dev', () => {
	it('resolves the workspace root from a nested directory', () => {
		const workspaceRoot = createWorkspaceFixture();
		const nestedDir = path.join(workspaceRoot, 'apps', 'ui-community');

		expect(resolveWorkspaceRoot({ startDir: nestedDir })).toBe(workspaceRoot);
	});

	it('derives shared hostnames and applies the worktree suffix', () => {
		const workspaceRoot = createWorkspaceFixture();

		expect(
			resolvePortlessHostnames({
				startDir: path.join(workspaceRoot, 'apps', 'ui-community'),
				env: { WORKTREE_NAME: 'feature-123' },
			}),
		).toEqual({
			uiCommunity: 'ownercommunity.feature-123.localhost',
			uiStaff: 'staff.ownercommunity.feature-123.localhost',
			api: 'data-access.ownercommunity.feature-123.localhost',
			mockAuth: 'mock-auth.ownercommunity.feature-123.localhost',
			docs: 'docs.ownercommunity.feature-123.localhost',
		});
		expect(buildPortlessUrl('ownercommunity.localhost')).toBe(`https://ownercommunity.localhost:${PORTLESS_PORT}`);
	});

	it('builds shared Vite args including e2e mode', () => {
		expect(
			buildViteArgs({
				host: '0.0.0.0',
				port: '4444',
				env: { E2E: 'true' },
			}),
		).toEqual(['--host', '0.0.0.0', '--port', '4444', '--mode', 'e2e']);
	});

	it('derives deterministic worktree ports and connection strings', () => {
		const workspaceRoot = createWorkspaceFixture();
		const env = { WORKTREE_NAME: 'feature-123' };

		expect(getWorktreePortOffset('feature-123')).toBeGreaterThanOrEqual(100);
		expect(getMongoPort('feature-123')).toBe(50000 + getWorktreePortOffset('feature-123'));
		expect(getAzuritePorts('feature-123')).toEqual({
			blob: 10000 + getWorktreePortOffset('feature-123'),
			queue: 10001 + getWorktreePortOffset('feature-123'),
			table: 10002 + getWorktreePortOffset('feature-123'),
		});
		expect(
			getMongoConnectionString({
				startDir: path.join(workspaceRoot, 'apps', 'api'),
				env,
			}),
		).toContain(`:${getMongoPort('feature-123')}/test?replicaSet=rs0`);
		expect(
			getAzuriteConnectionString({
				startDir: path.join(workspaceRoot, 'apps', 'api'),
				env,
			}),
		).toContain(`BlobEndpoint=http://127.0.0.1:${getAzuritePorts('feature-123').blob}/devstoreaccount1`);
	});

	it('applies worktree and runtime overrides to API local settings', () => {
		const workspaceRoot = createWorkspaceFixture();
		const settings = {
			Values: {
				STORAGE_ACCOUNT_NAME: 'devstoreaccount1',
				STORAGE_ACCOUNT_KEY: 'key',
				AZURE_STORAGE_CONNECTION_STRING: 'UseDevelopmentStorage=true',
			},
		};

		const updated = applyApiLocalSettingsOverrides(settings, {
			workspaceRoot,
			env: {
				WORKTREE_NAME: 'feature-123',
				COSMOSDB_CONNECTION_STRING: 'mongodb://127.0.0.1:61234/override?replicaSet=rs0',
			},
		});

		expect(updated.Values?.['ACCOUNT_PORTAL_OIDC_ISSUER']).toBe('https://mock-auth.ownercommunity.feature-123.localhost:1355/community');
		expect(updated.Values?.['STAFF_PORTAL_OIDC_ENDPOINT']).toBe('https://mock-auth.ownercommunity.feature-123.localhost:1355/staff/.well-known/jwks.json');
		expect(updated.Values?.['COSMOSDB_CONNECTION_STRING']).toBe('mongodb://127.0.0.1:61234/override?replicaSet=rs0');
		expect(updated.Values?.['AZURE_STORAGE_CONNECTION_STRING']).not.toBe('UseDevelopmentStorage=true');
	});
});
