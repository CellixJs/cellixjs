import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { readTsConfig, type TsConfig, validateCommonCompilerOptions, validateNodeCompilerOptions } from '../../../cellix/archunit-tests/src/validate-compiler-options';

// shared helper provides TsConfig type and validation helpers

const packagesRoot = join(fileURLToPath(new URL('../..', import.meta.url)));
const allowedSharedConfigs = new Set(['@cellix/config-typescript/base', '@cellix/config-typescript/node']);
const exemptWorkspacePackages = new Set(['ocom/archunit-tests']);

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
		validateCommonCompilerOptions(tsconfigPath, config, violations);
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
