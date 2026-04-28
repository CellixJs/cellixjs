import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
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

const packagesRoot = join(fileURLToPath(new URL('../../../..', import.meta.url)));
const allowedSharedConfigs = new Set(['@cellix/config-typescript/base', '@cellix/config-typescript/node']);
const exemptWorkspacePackages = new Set<string>([]);

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

function validateCommonCompilerOptions(tsconfigPath: string, config: TsConfig, violations: string[]): void {
	const outDir = config.compilerOptions?.outDir;
	const rootDir = config.compilerOptions?.rootDir;

	if (outDir !== 'dist' && outDir !== './dist') {
		violations.push(`${tsconfigPath}: compilerOptions.outDir must be "dist" or "./dist"`);
	}

	if (rootDir !== 'src') {
		violations.push(`${tsconfigPath}: compilerOptions.rootDir must be "src"`);
	}
}

function validateNodeCompilerOptions(tsconfigPath: string, config: TsConfig, violations: string[]): void {
	validateCommonCompilerOptions(tsconfigPath, config, violations);

	const tsBuildInfoFile = config.compilerOptions?.tsBuildInfoFile;
	if (tsBuildInfoFile !== 'dist/tsconfig.tsbuildinfo') {
		violations.push(`${tsconfigPath}: compilerOptions.tsBuildInfoFile must be "dist/tsconfig.tsbuildinfo"`);
	}
}

function validateBaseCompilerOptions(tsconfigPath: string, config: TsConfig, violations: string[]): void {
	validateCommonCompilerOptions(tsconfigPath, config, violations);
}

function validatePackageConfig(packagePath: string, config: TsConfig, violations: string[]): void {
	const tsconfigPath = join(packagesRoot, packagePath, 'tsconfig.json');
	const sharedConfig = config.extends;

	if (!sharedConfig || !allowedSharedConfigs.has(sharedConfig)) {
		violations.push(`${tsconfigPath}: extends must be one of ${Array.from(allowedSharedConfigs).join(', ')}`);
		return;
	}

	if (sharedConfig === '@cellix/config-typescript/node') {
		validateNodeCompilerOptions(tsconfigPath, config, violations);
		return;
	}

	if (!exemptWorkspacePackages.has(packagePath)) {
		validateBaseCompilerOptions(tsconfigPath, config, violations);
	}
}

describe('TypeScript Config Conventions', () => {
	it('OCom workspace packages should use the expected shared tsconfig and standard compiler options', async () => {
		const packagePaths = await listWorkspacePackages(packagesRoot);
		const violations: string[] = [];

		for (const packagePath of packagePaths) {
			if (!packagePath.startsWith('ocom/')) {
				continue;
			}

			const tsconfigPath = join(packagesRoot, packagePath, 'tsconfig.json');
			const config = await readTsConfig(tsconfigPath);
			if (!config) {
				violations.push(`${tsconfigPath}: unable to read tsconfig.json`);
				continue;
			}

			validatePackageConfig(packagePath, config, violations);
		}

		expect(violations, violations.join('\n')).toEqual([]);
	});
});
