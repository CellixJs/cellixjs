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
	convertSettingsForWorktree,
	getAzuritePorts,
	getMongoPort,
	getWorktreePortOffset,
	hostnameFromUrl,
	NodeDevRunner,
	PORTLESS_PORT,
	type RunnerSpawn,
	readDotEnv,
	replaceUrlPort,
	resolveAzureFunctionsLocalSettingsValues,
	resolveWorkspaceRoot,
	sanitizeWorktreeHostnameLabel,
	syncJsonFile,
	ViteDevRunner,
	WorktreeSettings,
} from '@cellix/local-dev';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildViteArgs } from './vite/index.ts';

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

function createMockChildProcess(): ReturnType<RunnerSpawn> {
	const proc = new EventEmitter() as ReturnType<RunnerSpawn>;
	proc.kill = vi.fn(() => true);
	return proc;
}

function expectNoDirectProcessExit(): ReturnType<typeof vi.spyOn> {
	return vi.spyOn(process, 'exit').mockImplementation((() => {
		throw new Error('process.exit should not be called by embeddable runners');
	}) as never);
}

describe('@cellix/local-dev', () => {
	afterEach(() => {
		vi.restoreAllMocks();
		process.exitCode = undefined;
	});

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

	it('allows programmatic callers to disable worktree transforms explicitly', () => {
		const env = new WorktreeSettings({
			env: { WORKTREE_NAME: 'Jason/Feature 123' },
			worktree: false,
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
			blobLocation: path.join(workspaceRoot, '__blobstorage__-jason-feature-123'),
		});
	});

	it('starts Azurite with API version checks disabled for newer Azure SDK clients', () => {
		const calls: Array<{ command: string; args: string[] }> = [];
		const spawn: RunnerSpawn = (command, args) => {
			calls.push({ command, args });
			return createMockChildProcess();
		};

		new AzuriteDevRunner({ spawn }).start();

		expect(calls).toEqual([
			expect.objectContaining({
				command: 'azurite-blob',
				args: expect.arrayContaining(['--skipApiVersionCheck']),
			}),
			expect.objectContaining({
				command: 'azurite-queue',
				args: expect.arrayContaining(['--skipApiVersionCheck']),
			}),
			expect.objectContaining({
				command: 'azurite-table',
				args: expect.arrayContaining(['--skipApiVersionCheck']),
			}),
		]);
	});

	it('sets exitCode instead of terminating the parent process when Azurite spawn fails', () => {
		const children: ReturnType<RunnerSpawn>[] = [];
		const spawn: RunnerSpawn = () => {
			const child = createMockChildProcess();
			children.push(child);
			return child;
		};
		const exitSpy = expectNoDirectProcessExit();
		const listenerCountBeforeStart = process.listenerCount('SIGINT');

		new AzuriteDevRunner({ spawn }).start();
		children[1]?.emit('error', new Error('missing binary'));

		expect(exitSpy).not.toHaveBeenCalled();
		expect(process.exitCode).toBe(1);
		expect(process.listenerCount('SIGINT')).toBe(listenerCountBeforeStart);
		expect(children.map((child) => child.kill)).toEqual([expect.any(Function), expect.any(Function), expect.any(Function)]);
		expect(children.every((child) => vi.mocked(child.kill).mock.calls.length === 1)).toBe(true);
	});

	it('sets exitCode instead of terminating the parent process when Azurite exits unexpectedly', () => {
		const children: ReturnType<RunnerSpawn>[] = [];
		const spawn: RunnerSpawn = () => {
			const child = createMockChildProcess();
			children.push(child);
			return child;
		};
		const exitSpy = expectNoDirectProcessExit();
		const listenerCountBeforeStart = process.listenerCount('SIGTERM');

		new AzuriteDevRunner({ spawn }).start();
		children[0]?.emit('exit', 17, null);

		expect(exitSpy).not.toHaveBeenCalled();
		expect(process.exitCode).toBe(17);
		expect(process.listenerCount('SIGTERM')).toBe(listenerCountBeforeStart);
		expect(children.every((child) => vi.mocked(child.kill).mock.calls.length === 1)).toBe(true);
	});

	it('sets a successful exitCode after all Azurite processes stop gracefully', () => {
		const children: ReturnType<RunnerSpawn>[] = [];
		const spawn: RunnerSpawn = () => {
			const child = createMockChildProcess();
			children.push(child);
			return child;
		};
		const exitSpy = expectNoDirectProcessExit();

		new AzuriteDevRunner({ spawn }).start();
		for (const child of children) {
			child.emit('exit', 130, 'SIGINT');
		}

		expect(exitSpy).not.toHaveBeenCalled();
		expect(process.exitCode).toBe(0);
	});

	it('preserves an existing non-zero exitCode when Azurite later reports another failure', () => {
		const children: ReturnType<RunnerSpawn>[] = [];
		const spawn: RunnerSpawn = () => {
			const child = createMockChildProcess();
			children.push(child);
			return child;
		};
		process.exitCode = 9;

		new AzuriteDevRunner({ spawn }).start();
		children[2]?.emit('exit', 17, null);

		expect(process.exitCode).toBe(9);
	});

	it('converts only the named settings for a worktree, leaving the rest untouched', () => {
		const azuriteConnectionString =
			'DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=key;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;QueueEndpoint=http://127.0.0.1:10001/devstoreaccount1;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1';
		const converted = convertSettingsForWorktree(
			{
				ACCOUNT_PORTAL_OIDC_ISSUER: 'https://mock-auth.ownercommunity.localhost:1355/community',
				COSMOSDB_CONNECTION_STRING: 'mongodb://127.0.0.1:50000/ocom',
				AZURE_STORAGE_CONNECTION_STRING: azuriteConnectionString,
				AzureWebJobsStorage: azuriteConnectionString,
				COSMOSDB_DBNAME: 'ocom',
			},
			'Jason/Feature 123',
			{
				urlKeys: ['ACCOUNT_PORTAL_OIDC_ISSUER'],
				mongoKeys: ['COSMOSDB_CONNECTION_STRING'],
				azuriteKeys: ['AZURE_STORAGE_CONNECTION_STRING', 'AzureWebJobsStorage'],
			},
		);
		const typedConverted = converted as typeof converted & {
			COSMOSDB_CONNECTION_STRING: string;
		};
		const ports = getAzuritePorts('Jason/Feature 123');

		expect(converted).toMatchObject({
			ACCOUNT_PORTAL_OIDC_ISSUER: 'https://mock-auth.ownercommunity.jason-feature-123.localhost:1355/community',
			AZURE_STORAGE_CONNECTION_STRING: expect.stringContaining(`BlobEndpoint=http://127.0.0.1:${ports.blob}/devstoreaccount1`),
			AzureWebJobsStorage: expect.stringContaining(`QueueEndpoint=http://127.0.0.1:${ports.queue}/devstoreaccount1`),
			// Unlisted keys are passed through untouched.
			COSMOSDB_DBNAME: 'ocom',
		});
		expect(typedConverted.COSMOSDB_CONNECTION_STRING).toBe(`mongodb://127.0.0.1:${getMongoPort('Jason/Feature 123')}/ocom`);
	});

	it('resolves Azure Functions settings with worktree conversion only when a worktree is active', () => {
		const options = {
			values: {
				COSMOSDB_CONNECTION_STRING: 'mongodb://127.0.0.1:50000/ocom',
				UNCHANGED: 'value',
			},
			worktreeConversion: {
				mongoKeys: ['COSMOSDB_CONNECTION_STRING'],
			},
		};

		const regular = resolveAzureFunctionsLocalSettingsValues({ ...options, env: {} });
		const worktree = resolveAzureFunctionsLocalSettingsValues({
			...options,
			env: { WORKTREE_NAME: 'feature-a' },
		});

		expect(regular).toEqual({
			COSMOSDB_CONNECTION_STRING: 'mongodb://127.0.0.1:50000/ocom',
			UNCHANGED: 'value',
		});
		expect(worktree).toEqual({
			COSMOSDB_CONNECTION_STRING: `mongodb://127.0.0.1:${getMongoPort('feature-a')}/ocom`,
			UNCHANGED: 'value',
		});
	});

	it('generates Azure Functions local settings before starting func', () => {
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

		new AzureFunctionsDevRunner({
			env: { E2E: 'true', PORT: '7071', WORKTREE_NAME: 'Jason/Feature 123' },
			localSettings: {
				appDir,
				values: {
					COSMOSDB_CONNECTION_STRING: 'mongodb://127.0.0.1:50000/ocom',
					AzureWebJobsStorage:
						'DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=key;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;QueueEndpoint=http://127.0.0.1:10001/devstoreaccount1;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1',
					ACCOUNT_PORTAL_OIDC_ISSUER: 'https://mock-auth.ownercommunity.localhost:1355/community',
					languageWorkers__node__arguments: '--inspect=5858',
				},
				e2eValues: {
					languageWorkers__node__arguments: '',
				},
				worktreeConversion: {
					urlKeys: ['ACCOUNT_PORTAL_OIDC_ISSUER'],
					mongoKeys: ['COSMOSDB_CONNECTION_STRING'],
					azuriteKeys: ['AzureWebJobsStorage'],
				},
			},
			spawn,
		}).start();

		const settings = JSON.parse(readFileSync(path.join(appDir, 'deploy', 'local.settings.json'), 'utf8'));
		expect(settings.Values).toMatchObject({
			ACCOUNT_PORTAL_OIDC_ISSUER: 'https://mock-auth.ownercommunity.jason-feature-123.localhost:1355/community',
			AzureWebJobsStorage: expect.stringContaining('BlobEndpoint=http://127.0.0.1:'),
			// E2E override applied over the base value.
			languageWorkers__node__arguments: '',
		});
		expect(settings.Values.COSMOSDB_CONNECTION_STRING).not.toBe('mongodb://127.0.0.1:50000/ocom');
		expect(calls[0]).toMatchObject({
			command: 'func',
			args: ['start', '--typescript', '--script-root', 'deploy/', '--port', '7071', '--cors', '*'],
		});
	});

	it('skips worktree conversion outside a worktree', () => {
		const workspaceRoot = createWorkspaceFixture();
		const appDir = path.join(workspaceRoot, 'fixtures', 'api');
		const spawn: RunnerSpawn = () => new EventEmitter() as ReturnType<RunnerSpawn>;

		new AzureFunctionsDevRunner({
			env: { PORT: '7071' },
			localSettings: {
				appDir,
				values: {
					COSMOSDB_CONNECTION_STRING: 'mongodb://127.0.0.1:50000/ocom',
					AzureWebJobsStorage: 'UseDevelopmentStorage=true',
				},
				worktreeConversion: {
					mongoKeys: ['COSMOSDB_CONNECTION_STRING'],
					azuriteKeys: ['AzureWebJobsStorage'],
				},
			},
			spawn,
		}).start();

		const settings = JSON.parse(readFileSync(path.join(appDir, 'deploy', 'local.settings.json'), 'utf8'));
		expect(settings.Values).toMatchObject({
			COSMOSDB_CONNECTION_STRING: 'mongodb://127.0.0.1:50000/ocom',
			AzureWebJobsStorage: 'UseDevelopmentStorage=true',
		});
	});
});
