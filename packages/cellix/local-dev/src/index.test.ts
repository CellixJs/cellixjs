import { EventEmitter } from 'node:events';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
	AzureFunctionsDevRunner,
	AzuriteDevRunner,
	applyWorktreeSuffix,
	buildAzuriteConnectionString,
	buildPortlessUrl,
	buildViteArgs,
	getAzuritePorts,
	getMongoPort,
	getWorktreePortOffset,
	hostnameFromUrl,
	NodeDevRunner,
	PORTLESS_PORT,
	type RunnerSpawn,
	readDotEnv,
	replaceUrlPort,
	resolveWorkspaceRoot,
	sanitizeWorktreeHostnameLabel,
	syncJsonFile,
	ViteDevRunner,
	WorktreeJsonFileSync,
	WorktreeSettings,
} from '@cellix/local-dev';
import { describe, expect, it } from 'vitest';

type DotEnvFixtureValues = Record<string, string> & {
	API_URL?: string;
	BASE_URL?: string;
};

function createWorkspaceFixture(): string {
	const root = mkdtempSync(path.join(tmpdir(), 'cellix-local-dev-'));
	writeFileSync(path.join(root, 'pnpm-workspace.yaml'), 'packages:\n  - "apps/*"\n');
	mkdirSync(path.join(root, 'fixtures'), { recursive: true });

	return root;
}

describe('@cellix/local-dev', () => {
	it('resolves the workspace root from a nested directory', () => {
		const workspaceRoot = createWorkspaceFixture();
		const nestedDir = path.join(workspaceRoot, 'fixtures');

		expect(resolveWorkspaceRoot({ startDir: nestedDir })).toBe(workspaceRoot);
	});

	it('parses dotenv values and applies worktree-aware URL helpers generically', () => {
		const workspaceRoot = createWorkspaceFixture();
		const envPath = path.join(workspaceRoot, 'fixtures', '.env');
		writeFileSync(envPath, ['export BASE_URL="https://ownercommunity.localhost:1355"', "API_URL='https://data-access.ownercommunity.localhost:1355/api/graphql'", 'IGNORED_LINE_WITHOUT_SEPARATOR'].join('\n'));

		const envValues = readDotEnv(envPath) as DotEnvFixtureValues;
		const baseUrl = envValues.BASE_URL;
		const apiUrl = envValues.API_URL;

		expect(envValues).toEqual({
			BASE_URL: 'https://ownercommunity.localhost:1355',
			API_URL: 'https://data-access.ownercommunity.localhost:1355/api/graphql',
		});
		expect(baseUrl).toBe('https://ownercommunity.localhost:1355');
		expect(apiUrl).toBe('https://data-access.ownercommunity.localhost:1355/api/graphql');
		if (!baseUrl || !apiUrl) {
			throw new Error('Expected dotenv fixture values to be defined');
		}
		expect(hostnameFromUrl(baseUrl)).toBe('ownercommunity.localhost');
		expect(sanitizeWorktreeHostnameLabel('Jason/Feature 123')).toBe('jason-feature-123');
		expect(sanitizeWorktreeHostnameLabel('---')).toBeUndefined();
		expect(applyWorktreeSuffix('ownercommunity.localhost', 'Jason/Feature 123')).toBe('ownercommunity.jason-feature-123.localhost');
		expect(applyWorktreeSuffix('ownercommunity.jason-feature-123.localhost', 'Jason/Feature 123')).toBe('ownercommunity.jason-feature-123.localhost');
		expect(applyWorktreeSuffix('localhost', 'Jason/Feature 123')).toBe('jason-feature-123.localhost');
		expect(applyWorktreeSuffix('example.com', 'feature-123')).toBe('example.com');
		expect(buildPortlessUrl('ownercommunity.localhost')).toBe(`https://ownercommunity.localhost:${PORTLESS_PORT}`);
		expect(replaceUrlPort(apiUrl, 50900)).toBe('https://data-access.ownercommunity.localhost:50900/api/graphql');
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
		expect(getWorktreePortOffset('feature-123')).toBeGreaterThanOrEqual(100);
		expect(getMongoPort('feature-123')).toBe(50000 + getWorktreePortOffset('feature-123'));
		expect(getAzuritePorts('feature-123')).toEqual({
			blob: 10000 + getWorktreePortOffset('feature-123'),
			queue: 10001 + getWorktreePortOffset('feature-123'),
			table: 10002 + getWorktreePortOffset('feature-123'),
		});
		expect(
			buildAzuriteConnectionString({
				accountKey: 'key',
				accountName: 'devstoreaccount1',
				ports: getAzuritePorts('feature-123'),
			}),
		).toContain(`BlobEndpoint=http://127.0.0.1:${getAzuritePorts('feature-123').blob}/devstoreaccount1`);
	});

	it('syncs json files through a consumer-supplied transform', () => {
		const workspaceRoot = createWorkspaceFixture();
		const sourcePath = path.join(workspaceRoot, 'fixtures', 'source.json');
		const targetPath = path.join(workspaceRoot, 'fixtures', 'target', 'settings.json');
		writeFileSync(
			sourcePath,
			JSON.stringify(
				{
					Values: {
						MODE: 'local',
					},
				},
				null,
				2,
			),
		);

		syncJsonFile({
			sourcePath,
			targetPath,
			transform: (document: { Values?: Record<string, string> }) => ({
				...document,
				Values: {
					...(document.Values ?? {}),
					MODE: 'e2e',
				},
			}),
		});

		expect(JSON.parse(readFileSync(targetPath, 'utf8'))).toEqual({
			Values: {
				MODE: 'e2e',
			},
		});
	});

	it('starts runner objects with inherited stdio and caller-provided environment', () => {
		const calls: Array<{ command: string; args: string[]; env?: NodeJS.ProcessEnv }> = [];
		const spawn: RunnerSpawn = (command, args, options) => {
			calls.push({
				command,
				args,
				...(options.env ? { env: options.env } : {}),
			});
			return new EventEmitter() as ReturnType<RunnerSpawn>;
		};

		new ViteDevRunner({
			env: { PORT: '4444', HOST: '127.0.0.1' },
			spawn,
		}).start();
		new NodeDevRunner({
			env: { PORT: '50000' },
			spawn,
		}).start();

		expect(calls).toEqual([
			{
				command: 'vite',
				args: ['--host', '127.0.0.1', '--port', '4444'],
				env: { PORT: '4444', HOST: '127.0.0.1' },
			},
			{
				command: 'node',
				args: ['src/index.ts'],
				env: { PORT: '50000' },
			},
		]);
	});

	it('applies worktree transforms to arbitrary env settings', () => {
		const env = new WorktreeSettings({
			env: { WORKTREE_NAME: 'Jason/Feature 123' },
			settings: {
				BASE_URL: 'https://mock-auth.ownercommunity.localhost:1355',
				API_URL: 'https://data-access.ownercommunity.localhost:1355/api/graphql',
				COSMOSDB_CONNECTION_STRING: 'mongodb://127.0.0.1:50000/ocom',
				PORT: '50000',
			},
		}).toEnv();

		expect(env).toMatchObject({
			BASE_URL: 'https://mock-auth.ownercommunity.jason-feature-123.localhost:1355',
			API_URL: 'https://data-access.ownercommunity.jason-feature-123.localhost:1355/api/graphql',
			COSMOSDB_CONNECTION_STRING: expect.not.stringMatching(':50000/ocom'),
			PORT: String(getMongoPort('Jason/Feature 123')),
		});
	});

	it('does not apply worktree transforms when CELLIX_WORKTREE disables them', () => {
		const env = new WorktreeSettings({
			env: { CELLIX_WORKTREE: '0', WORKTREE_NAME: 'Jason/Feature 123' },
			settings: {
				BASE_URL: 'https://mock-auth.ownercommunity.localhost:1355',
				PORT: '50000',
			},
		}).toEnv();

		expect(env).toMatchObject({
			BASE_URL: 'https://mock-auth.ownercommunity.localhost:1355',
			PORT: '50000',
		});
	});

	it('starts worktree-aware Vite and Node runners with transformed settings', () => {
		const calls: Array<{ command: string; args: string[]; env?: NodeJS.ProcessEnv }> = [];
		const spawn: RunnerSpawn = (command, args, options) => {
			calls.push({
				command,
				args,
				...(options.env ? { env: options.env } : {}),
			});
			return new EventEmitter() as ReturnType<RunnerSpawn>;
		};

		new ViteDevRunner({
			env: { WORKTREE_NAME: 'Jason/Feature 123' },
			settings: {
				VITE_COMMON_API_ENDPOINT: 'https://data-access.ownercommunity.localhost:1355/api/graphql',
			},
			spawn,
		}).start();
		new NodeDevRunner({
			env: { WORKTREE_NAME: 'Jason/Feature 123' },
			settings: {
				PORT: '50000',
			},
			spawn,
		}).start();

		expect(calls[0]).toMatchObject({
			command: 'vite',
			env: {
				VITE_COMMON_API_ENDPOINT: 'https://data-access.ownercommunity.jason-feature-123.localhost:1355/api/graphql',
			},
		});
		expect(calls[1]).toMatchObject({
			command: 'node',
			args: ['src/index.ts'],
			env: {
				PORT: String(getMongoPort('Jason/Feature 123')),
			},
		});
	});

	it('derives worktree-aware Azurite options generically', () => {
		const workspaceRoot = createWorkspaceFixture();
		const options = new AzuriteDevRunner({
			env: { WORKTREE_NAME: 'Jason/Feature 123' },
			workspaceRoot,
		}).resolveOptions();

		expect(options).toMatchObject({
			blobPort: getAzuritePorts('Jason/Feature 123').blob,
			queuePort: getAzuritePorts('Jason/Feature 123').queue,
			tablePort: getAzuritePorts('Jason/Feature 123').table,
			blobLocation: path.join(workspaceRoot, '__blobstorage__-Jason/Feature 123'),
		});
	});

	it('syncs json settings with generic worktree URL, Mongo, and Azurite transforms', () => {
		const workspaceRoot = createWorkspaceFixture();
		const sourcePath = path.join(workspaceRoot, 'fixtures', 'settings.e2e.json');
		const targetPath = path.join(workspaceRoot, 'fixtures', 'deploy', 'local.settings.json');
		writeFileSync(
			sourcePath,
			JSON.stringify({
				Values: {
					STORAGE_ACCOUNT_NAME: 'devstoreaccount1',
					STORAGE_ACCOUNT_KEY: 'key',
					COSMOSDB_CONNECTION_STRING: 'mongodb://127.0.0.1:50000/ocom',
				},
			}),
		);

		new WorktreeJsonFileSync({
			env: { WORKTREE_NAME: 'Jason/Feature 123' },
			sourcePath,
			targetPath,
			values: {
				ACCOUNT_PORTAL_OIDC_ISSUER: 'https://mock-auth.ownercommunity.localhost:1355/community',
			},
			azuriteConnectionStringKeys: ['AZURE_STORAGE_CONNECTION_STRING', 'AzureWebJobsStorage'],
		}).sync();

		const settings = JSON.parse(readFileSync(targetPath, 'utf8'));
		expect(settings.Values).toMatchObject({
			ACCOUNT_PORTAL_OIDC_ISSUER: 'https://mock-auth.ownercommunity.jason-feature-123.localhost:1355/community',
			AZURE_STORAGE_CONNECTION_STRING: expect.stringContaining('BlobEndpoint=http://127.0.0.1:'),
			AzureWebJobsStorage: expect.stringContaining('QueueEndpoint=http://127.0.0.1:'),
		});
		expect(settings.Values.COSMOSDB_CONNECTION_STRING).not.toBe('mongodb://127.0.0.1:50000/ocom');
	});

	it('syncs json settings without worktree transforms when CELLIX_WORKTREE disables them', () => {
		const workspaceRoot = createWorkspaceFixture();
		const sourcePath = path.join(workspaceRoot, 'fixtures', 'settings.local.json');
		const targetPath = path.join(workspaceRoot, 'fixtures', 'deploy', 'local.settings.json');
		writeFileSync(
			sourcePath,
			JSON.stringify({
				Values: {
					STORAGE_ACCOUNT_NAME: 'devstoreaccount1',
					STORAGE_ACCOUNT_KEY: 'key',
					COSMOSDB_CONNECTION_STRING: 'mongodb://127.0.0.1:50000/ocom',
				},
			}),
		);

		new WorktreeJsonFileSync({
			env: { CELLIX_WORKTREE: '0', WORKTREE_NAME: 'Jason/Feature 123' },
			sourcePath,
			targetPath,
			values: {
				ACCOUNT_PORTAL_OIDC_ISSUER: 'https://mock-auth.ownercommunity.localhost:1355/community',
			},
			azuriteConnectionStringKeys: ['AzureWebJobsStorage'],
		}).sync();

		const settings = JSON.parse(readFileSync(targetPath, 'utf8'));
		expect(settings.Values).toMatchObject({
			ACCOUNT_PORTAL_OIDC_ISSUER: 'https://mock-auth.ownercommunity.localhost:1355/community',
			COSMOSDB_CONNECTION_STRING: 'mongodb://127.0.0.1:50000/ocom',
		});
		expect(settings.Values.AzureWebJobsStorage).toBeUndefined();
	});

	it('prepares Azure Functions local settings before starting func', () => {
		const workspaceRoot = createWorkspaceFixture();
		const appDir = path.join(workspaceRoot, 'fixtures', 'api');
		const calls: Array<{ command: string; args: string[]; env?: NodeJS.ProcessEnv }> = [];
		const spawn: RunnerSpawn = (command, args, options) => {
			calls.push({
				command,
				args,
				...(options.env ? { env: options.env } : {}),
			});
			return new EventEmitter() as ReturnType<RunnerSpawn>;
		};
		mkdirSync(appDir, { recursive: true });
		writeFileSync(
			path.join(appDir, 'local-settings.e2e.json'),
			JSON.stringify({
				Values: {
					STORAGE_ACCOUNT_NAME: 'devstoreaccount1',
					STORAGE_ACCOUNT_KEY: 'key',
					COSMOSDB_CONNECTION_STRING: 'mongodb://127.0.0.1:50000/ocom',
				},
			}),
		);

		new AzureFunctionsDevRunner({
			env: { E2E: 'true', PORT: '7071', WORKTREE_NAME: 'Jason/Feature 123' },
			localSettings: {
				appDir,
				e2eValues: {
					ACCOUNT_PORTAL_OIDC_ISSUER: 'https://mock-auth.ownercommunity.localhost:1355/community',
				},
				azuriteConnectionStringKeys: ['AzureWebJobsStorage'],
			},
			spawn,
		}).start();

		const settings = JSON.parse(readFileSync(path.join(appDir, 'deploy', 'local.settings.json'), 'utf8'));
		expect(settings.Values).toMatchObject({
			ACCOUNT_PORTAL_OIDC_ISSUER: 'https://mock-auth.ownercommunity.jason-feature-123.localhost:1355/community',
			AzureWebJobsStorage: expect.stringContaining('BlobEndpoint=http://127.0.0.1:'),
		});
		expect(settings.Values.COSMOSDB_CONNECTION_STRING).not.toBe('mongodb://127.0.0.1:50000/ocom');
		expect(calls[0]).toMatchObject({
			command: 'func',
			args: ['start', '--typescript', '--script-root', 'deploy/', '--port', '7071', '--cors', '*'],
		});
	});
});
