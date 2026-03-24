import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	buildCjsAliasMap,
	createCellixAzureFunctionsRolldownConfig,
	prepareCellixAzureFunctionsDeploy,
} from './index.js';

const repoWorkspaceRoot = path.resolve(import.meta.dirname, '../../../..');

describe('@cellix/config-rolldown', () => {
	afterEach(async () => {
		await cleanupTempRepos();
	});

	it('creates the standard Cellix Azure Functions rolldown config', async () => {
		const repoRoot = await createTempRepo({
			'apps/api/package.json': JSON.stringify(
				{
					name: '@apps/api',
					version: '1.0.0',
					dependencies: {
						'@cellix/shared': 'workspace:*',
						graphql: '^16.10.0',
						'definitely-missing-package': '^1.0.0',
					},
				},
				null,
				2,
			),
			'packages/cellix/shared/package.json': JSON.stringify(
				{
					name: '@cellix/shared',
					version: '1.0.0',
					dependencies: {
						rolldown: '1.0.0-beta.55',
					},
				},
				null,
				2,
			),
		});

		const config = await createCellixAzureFunctionsRolldownConfig({
			repoRoot,
			appPackageName: '@apps/api',
			applicationNamespaces: ['@apps/'],
		});

		expect(config.input).toBe('./dist/index.js');
		expect(config.platform).toBe('node');
		expect(config.external).toEqual(
			expect.arrayContaining([expect.any(RegExp), '@azure/functions-core']),
		);
		expect(config.output).toMatchObject({
			dir: 'deploy/dist',
			format: 'esm',
			sourcemap: true,
		});
		expect(config.resolve?.alias).toMatchObject({
			graphql: expect.stringContaining('graphql'),
			rolldown: expect.stringContaining('rolldown'),
		});
		expect(config.resolve?.alias).not.toHaveProperty('definitely-missing-package');

		const defaultHandler = vi.fn();
		config.onLog?.(
			'warn',
			{
				code: 'EVAL',
				message: 'Uses eval in @protobufjs/inquire/index.js',
			},
			defaultHandler,
		);
		expect(defaultHandler).not.toHaveBeenCalled();

		config.onLog?.(
			'warn',
			{
				code: 'OTHER',
				message: 'keep this warning',
			},
			defaultHandler,
		);
		expect(defaultHandler).toHaveBeenCalledTimes(1);
	});

	it('throws when the requested workspace package cannot be found', async () => {
		const repoRoot = await createTempRepo({});

		await expect(
			buildCjsAliasMap({
				repoRoot,
				appPackageName: '@apps/missing',
				workspaceNamespaces: ['@apps/', '@cellix/'],
			}),
		).rejects.toThrow('Workspace package not found: @apps/missing');
	});

	it('prepares the deploy artifact for Azure Functions', async () => {
		const appDir = await createTempRepo({
			'package.json': JSON.stringify(
				{
					name: '@apps/api',
					version: '2.3.4',
				},
				null,
				2,
			),
			'host.json': JSON.stringify({ version: '2.0' }, null, 2),
			'deploy/dist/index.js': 'export const handler = () => "ok";\n',
		});

		await prepareCellixAzureFunctionsDeploy({ appDir });

		const copiedHostJson = await fs.readFile(path.join(appDir, 'deploy/host.json'), 'utf8');
		const deployPackageJson = JSON.parse(
			await fs.readFile(path.join(appDir, 'deploy/package.json'), 'utf8'),
		) as Record<string, unknown>;

		expect(JSON.parse(copiedHostJson)).toEqual({ version: '2.0' });
		expect(deployPackageJson).toEqual({
			name: '@apps/api',
			version: '2.3.4',
			private: true,
			type: 'module',
			main: 'dist/index.js',
		});
	});

	it('fails prepare:deploy when the bundle entry is missing', async () => {
		const appDir = await createTempRepo({
			'package.json': JSON.stringify({ name: '@apps/api', version: '1.0.0' }, null, 2),
			'host.json': JSON.stringify({ version: '2.0' }, null, 2),
		});

		await expect(prepareCellixAzureFunctionsDeploy({ appDir })).rejects.toThrow(
			'Run the app build before prepare:deploy.',
		);
	});
});

async function createTempRepo(files: Record<string, string>): Promise<string> {
	const repoRoot = await fs.mkdtemp(path.join(repoWorkspaceRoot, '.tmp-config-rolldown-'));
	await fs.mkdir(path.join(repoRoot, 'apps'), { recursive: true });
	await fs.mkdir(path.join(repoRoot, 'packages'), { recursive: true });

	for (const [relativePath, content] of Object.entries(files)) {
		const absolutePath = path.join(repoRoot, relativePath);
		await fs.mkdir(path.dirname(absolutePath), { recursive: true });
		await fs.writeFile(absolutePath, content);
	}

	return repoRoot;
}

async function cleanupTempRepos(): Promise<void> {
	const entries = await fs.readdir(repoWorkspaceRoot, { withFileTypes: true });

	await Promise.all(
		entries
			.filter((entry) => entry.isDirectory() && entry.name.startsWith('.tmp-config-rolldown-'))
			.map((entry) =>
				fs.rm(path.join(repoWorkspaceRoot, entry.name), { recursive: true, force: true }),
			),
	);
}
