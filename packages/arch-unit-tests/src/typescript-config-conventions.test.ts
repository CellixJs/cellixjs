import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

type TsConfig = {
	extends?: string;
	compilerOptions?: {
		outDir?: string;
		tsBuildInfoFile?: string;
		rootDir?: string;
	};
};

const packagesRoot = join(__dirname, '..', '..');
const expectedPackageConfigs = new Map<string, '@cellix/typescript-config/base' | '@cellix/typescript-config/node'>([
	['cellix/api-services-spec', '@cellix/typescript-config/node'],
	['cellix/domain-seedwork', '@cellix/typescript-config/node'],
	['cellix/event-bus-seedwork-node', '@cellix/typescript-config/node'],
	['cellix/graphql-codegen', '@cellix/typescript-config/node'],
	['cellix/graphql-core', '@cellix/typescript-config/node'],
	['cellix/mock-mongodb-memory-server', '@cellix/typescript-config/node'],
	['cellix/mock-oauth2-server', '@cellix/typescript-config/node'],
	['cellix/mongoose-seedwork', '@cellix/typescript-config/node'],
	['cellix/ui-core', '@cellix/typescript-config/base'],
	['cellix/vitest-config', '@cellix/typescript-config/node'],
	['ocom/application-services', '@cellix/typescript-config/node'],
	['ocom/context-spec', '@cellix/typescript-config/node'],
	['ocom/data-sources-mongoose-models', '@cellix/typescript-config/node'],
	['ocom/domain', '@cellix/typescript-config/node'],
	['ocom/event-handler', '@cellix/typescript-config/node'],
	['ocom/graphql', '@cellix/typescript-config/node'],
	['ocom/graphql-handler', '@cellix/typescript-config/node'],
	['ocom/persistence', '@cellix/typescript-config/node'],
	['ocom/rest', '@cellix/typescript-config/node'],
	['ocom/service-apollo-server', '@cellix/typescript-config/node'],
	['ocom/service-blob-storage', '@cellix/typescript-config/node'],
	['ocom/service-mongoose', '@cellix/typescript-config/node'],
	['ocom/service-otel', '@cellix/typescript-config/node'],
	['ocom/service-token-validation', '@cellix/typescript-config/node'],
	['ocom/ui-components', '@cellix/typescript-config/base'],
]);
const exemptWorkspacePackages = new Set(['arch-unit-tests', 'cellix/typescript-config']);

async function listWorkspacePackages(rootPath: string, prefix = ''): Promise<string[]> {
	const entries = await readdir(rootPath, { withFileTypes: true });
	const packagePaths: string[] = [];

	for (const entry of entries) {
		if (!entry.isDirectory() || entry.name === 'node_modules' || entry.name === 'dist') {
			continue;
		}

		const relativePath = prefix ? join(prefix, entry.name) : entry.name;
		const absolutePath = join(rootPath, entry.name);
		const childEntries = await readdir(absolutePath, { withFileTypes: true });
		const hasPackageJson = childEntries.some((childEntry) => childEntry.isFile() && childEntry.name === 'package.json');

		if (hasPackageJson) {
			packagePaths.push(relativePath);
			continue;
		}

		packagePaths.push(...(await listWorkspacePackages(absolutePath, relativePath)));
	}

	return packagePaths;
}

function readTsConfig(filePath: string): Promise<TsConfig | null> {
	const result = ts.readConfigFile(filePath, ts.sys.readFile);
	if (result.error) {
		return Promise.resolve(null);
	}

	return Promise.resolve(result.config as TsConfig);
}

describe('TypeScript Config Conventions', () => {
	it('workspace packages under packages/ should use the expected shared tsconfig and standard compiler options', async () => {
		const packagePaths = await listWorkspacePackages(packagesRoot);
		const violations: string[] = [];

		for (const packagePath of packagePaths) {
			if (exemptWorkspacePackages.has(packagePath)) {
				continue;
			}

			const expectedExtends = expectedPackageConfigs.get(packagePath);
			if (!expectedExtends) {
				violations.push(`packages/${packagePath}: missing tsconfig convention entry in test`);
				continue;
			}

			const tsconfigPath = join(packagesRoot, packagePath, 'tsconfig.json');
			const config = await readTsConfig(tsconfigPath);
			if (!config) {
				violations.push(`${tsconfigPath}: unable to read tsconfig.json`);
				continue;
			}

			if (config.extends !== expectedExtends) {
				violations.push(`${tsconfigPath}: extends must be "${expectedExtends}"`);
			}

			const outDir = config.compilerOptions?.outDir;
			const rootDir = config.compilerOptions?.rootDir;

			if (expectedExtends === '@cellix/typescript-config/node') {
				const tsBuildInfoFile = config.compilerOptions?.tsBuildInfoFile;

				if (outDir !== 'dist' && outDir !== './dist') {
					violations.push(`${tsconfigPath}: compilerOptions.outDir must be "dist" or "./dist"`);
				}

				if (tsBuildInfoFile !== 'dist/tsconfig.tsbuildinfo') {
					violations.push(
						`${tsconfigPath}: compilerOptions.tsBuildInfoFile must be "dist/tsconfig.tsbuildinfo"`,
					);
				}

				if (rootDir !== 'src') {
					violations.push(`${tsconfigPath}: compilerOptions.rootDir must be "src"`);
				}
			}

			if (
				expectedExtends === '@cellix/typescript-config/base' &&
				packagePath !== 'arch-unit-tests'
			) {
				if (outDir !== 'dist' && outDir !== './dist') {
					violations.push(`${tsconfigPath}: compilerOptions.outDir must be "dist" or "./dist"`);
				}

				if (rootDir !== 'src') {
					violations.push(`${tsconfigPath}: compilerOptions.rootDir must be "src"`);
				}
			}
		}

		expect(violations).toEqual([]);
	});
});
