import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
	applyWorktreeSuffix,
	buildAzuriteConnectionString,
	buildPortlessUrl,
	buildViteArgs,
	getAzuritePorts,
	getMongoPort,
	getWorktreePortOffset,
	hostnameFromUrl,
	PORTLESS_PORT,
	readDotEnv,
	replaceUrlPort,
	resolveWorkspaceRoot,
	sanitizeWorktreeHostnameLabel,
	syncJsonFile,
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
});
