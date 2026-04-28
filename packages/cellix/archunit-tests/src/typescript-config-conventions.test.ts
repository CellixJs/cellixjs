import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('TypeScript Config Conventions', () => {
	const packagesDir = path.resolve(__dirname, '../../../');

	function findTsConfigFiles(dir: string): string[] {
		const results: string[] = [];
		const entries = fs.readdirSync(dir, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== 'coverage') {
				results.push(...findTsConfigFiles(fullPath));
			} else if (entry.name === 'tsconfig.json') {
				results.push(fullPath);
			}
		}
		return results;
	}

	it('all cellix packages should use standard compiler output options', () => {
		const cellixDir = path.join(packagesDir, 'cellix');
		if (!fs.existsSync(cellixDir)) return;

		const tsconfigs = findTsConfigFiles(cellixDir);
		const violations: string[] = [];

		for (const configPath of tsconfigs) {
			const content = fs.readFileSync(configPath, 'utf8');
			const stripped = content
				.replace(/\/\/.*$/gm, '')
				.replace(/\/\*[\s\S]*?\*\//g, '')
				.replace(/,\s*([}\]])/g, '$1');
			const config = JSON.parse(stripped);

			if (config.compilerOptions?.outDir && config.compilerOptions.outDir !== 'dist') {
				violations.push(`${configPath}: outDir should be "dist", got "${config.compilerOptions.outDir}"`);
			}
		}

		expect(violations).toStrictEqual([]);
	});
});
