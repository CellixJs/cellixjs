import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from '@typescript/typescript6';
import { describe, expect, it } from 'vitest';

type TsConfig = {
	compilerOptions?: {
		outDir?: string;
		tsBuildInfoFile?: string;
		rootDir?: string;
	};
};

const packagesRoot = join(fileURLToPath(new URL('../../..', import.meta.url)));
const exemptWorkspacePackages = new Set(['cellix/archunit-tests', 'cellix/config-typescript']);

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

function validateCompilerOptions(tsconfigPath: string, config: TsConfig, violations: string[]): void {
	const outDir = config.compilerOptions?.outDir;
	const rootDir = config.compilerOptions?.rootDir;
	const tsBuildInfoFile = config.compilerOptions?.tsBuildInfoFile;

	if (outDir !== 'dist' && outDir !== './dist') {
		violations.push(`${tsconfigPath}: compilerOptions.outDir must be "dist" or "./dist"`);
	}

	if (rootDir !== 'src') {
		violations.push(`${tsconfigPath}: compilerOptions.rootDir must be "src"`);
	}

	if (tsBuildInfoFile !== 'dist/tsconfig.tsbuildinfo') {
		violations.push(`${tsconfigPath}: compilerOptions.tsBuildInfoFile must be "dist/tsconfig.tsbuildinfo"`);
	}
}

describe('Cellix TypeScript Config Conventions', () => {
	it('Cellix workspace packages should use the standard compiler output options', async () => {
		const packagePaths = await listWorkspacePackages(packagesRoot);
		const violations: string[] = [];

		for (const packagePath of packagePaths) {
			if (!packagePath.startsWith('cellix/')) {
				continue;
			}

			if (exemptWorkspacePackages.has(packagePath)) {
				continue;
			}

			const tsconfigPath = join(packagesRoot, packagePath, 'tsconfig.json');
			const config = await readTsConfig(tsconfigPath);
			if (!config) {
				violations.push(`${tsconfigPath}: unable to read tsconfig.json`);
				continue;
			}

			validateCompilerOptions(tsconfigPath, config, violations);
		}

		expect(violations, violations.join('\n')).toEqual([]);
	});
});
