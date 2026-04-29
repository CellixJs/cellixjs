import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { readTsConfig, validateNodeCompilerOptions } from './validate-compiler-options';

// re-exported TsConfig is provided by the shared helper

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

			validateNodeCompilerOptions(tsconfigPath, config, violations);
		}

		expect(violations, violations.join('\n')).toEqual([]);
	});
});
