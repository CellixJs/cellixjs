import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkViteEnvAccessStyle, describeViteEnvAccessStyleTests } from './frontend.js';

const scratchRoots: string[] = [];

const createScratchRoot = (): string => {
	const scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vite-env-access-style-'));
	scratchRoots.push(scratchRoot);
	return scratchRoot;
};

afterEach(() => {
	for (const scratchRoot of scratchRoots.splice(0)) {
		fs.rmSync(scratchRoot, { recursive: true, force: true });
	}
});

const writeSource = (root: string, relativePath: string, content: string): string => {
	const filePath = path.join(root, relativePath);
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, content, 'utf8');
	return filePath;
};

describe('checkViteEnvAccessStyle', () => {
	it('requires scanPaths', async () => {
		await expect(checkViteEnvAccessStyle({ scanPaths: [] })).rejects.toThrow(/scanPaths/);
	});

	it('allows property access of declared Vite env names and builtins', async () => {
		const root = createScratchRoot();
		writeSource(
			root,
			'src/config.ts',
			[
				'const endpoint = import.meta.env.VITE_COMMON_API_ENDPOINT;',
				'const isProd = import.meta.env.PROD;',
				'const isDev = import.meta.env.DEV;',
				'const mode = import.meta.env.MODE;',
				'const baseUrl = import.meta.env.BASE_URL;',
				'const ssr = import.meta.env.SSR;',
			].join('\n'),
		);

		await expect(checkViteEnvAccessStyle({ scanPaths: [root] })).resolves.toStrictEqual([]);
	});

	it('reports object destructuring from import.meta.env', async () => {
		const root = createScratchRoot();
		writeSource(root, 'src/config.ts', 'const { VITE_COMMON_API_ENDPOINT } = import.meta.env;\n');

		const violations = await checkViteEnvAccessStyle({ scanPaths: [root] });

		expect(violations).toEqual(expect.arrayContaining([expect.stringMatching(/config\.ts:1.*destructure import\.meta\.env/)]));
	});

	it('reports multiline and renamed destructuring from import.meta.env', async () => {
		const root = createScratchRoot();
		writeSource(root, 'src/config.ts', ['const {', '\tVITE_COMMON_API_ENDPOINT: endpoint,', '\t...rest', '} = import.meta.env;', 'void endpoint;', 'void rest;'].join('\n'));

		const violations = await checkViteEnvAccessStyle({ scanPaths: [root] });

		expect(violations.some((violation) => violation.includes('destructure import.meta.env'))).toBe(true);
	});

	it('reports assignment destructuring from import.meta.env', async () => {
		const root = createScratchRoot();
		writeSource(root, 'src/config.ts', 'let endpoint: string;\n({ VITE_COMMON_API_ENDPOINT: endpoint } = import.meta.env);\nvoid endpoint;\n');

		const violations = await checkViteEnvAccessStyle({ scanPaths: [root] });

		expect(violations.some((violation) => violation.includes('destructure import.meta.env'))).toBe(true);
	});

	it('reports parameter destructuring that defaults from import.meta.env', async () => {
		const root = createScratchRoot();
		writeSource(root, 'src/config.ts', 'export function readEnv({ VITE_COMMON_API_ENDPOINT } = import.meta.env): string {\n\treturn VITE_COMMON_API_ENDPOINT;\n}\n');

		const violations = await checkViteEnvAccessStyle({ scanPaths: [root] });

		expect(violations.some((violation) => violation.includes('destructure import.meta.env'))).toBe(true);
	});

	it('reports string-literal index access on import.meta.env', async () => {
		const root = createScratchRoot();
		writeSource(root, 'src/config.ts', "const endpoint = import.meta.env['VITE_COMMON_API_ENDPOINT'];\n");

		const violations = await checkViteEnvAccessStyle({ scanPaths: [root] });

		expect(violations).toEqual(expect.arrayContaining([expect.stringMatching(/config\.ts:1.*index access on import\.meta\.env/)]));
	});

	it('reports double-quoted and template index access on import.meta.env', async () => {
		const root = createScratchRoot();
		writeSource(root, 'src/config.ts', ['const a = import.meta.env["VITE_COMMON_API_ENDPOINT"];', 'const b = import.meta.env[`VITE_COMMON_API_ENDPOINT`];', 'void a;', 'void b;'].join('\n'));

		const violations = await checkViteEnvAccessStyle({ scanPaths: [root] });
		const indexViolations = violations.filter((violation) => violation.includes('index access on import.meta.env'));

		expect(indexViolations).toHaveLength(2);
	});

	it('reports dynamic index access on import.meta.env', async () => {
		const root = createScratchRoot();
		writeSource(root, 'src/config.ts', 'const key = "VITE_COMMON_API_ENDPOINT";\nconst endpoint = import.meta.env[key];\nvoid endpoint;\n');

		const violations = await checkViteEnvAccessStyle({ scanPaths: [root] });

		expect(violations.some((violation) => violation.includes('index access on import.meta.env'))).toBe(true);
	});

	it('ignores import.meta.env mentions in comments and string literals', async () => {
		const root = createScratchRoot();
		writeSource(
			root,
			'src/config.ts',
			[
				'// const { VITE_COMMON_API_ENDPOINT } = import.meta.env;',
				'const sample = "const { VITE_COMMON_API_ENDPOINT } = import.meta.env";',
				'const also = \'import.meta.env["VITE_COMMON_API_ENDPOINT"]\';',
				'void sample;',
				'void also;',
			].join('\n'),
		);

		await expect(checkViteEnvAccessStyle({ scanPaths: [root] })).resolves.toStrictEqual([]);
	});

	it('scans tsx files and skips declaration files and skipped directories', async () => {
		const root = createScratchRoot();
		writeSource(root, 'src/widget.tsx', 'export const endpoint = import.meta.env.VITE_COMMON_API_ENDPOINT;\n');
		writeSource(root, 'src/env.d.ts', 'const { VITE_COMMON_API_ENDPOINT } = import.meta.env;\n');
		writeSource(root, 'node_modules/pkg/index.ts', 'const { VITE_COMMON_API_ENDPOINT } = import.meta.env;\n');
		writeSource(root, 'dist/config.js', 'const { VITE_COMMON_API_ENDPOINT } = import.meta.env;\n');

		await expect(checkViteEnvAccessStyle({ scanPaths: [root] })).resolves.toStrictEqual([]);
	});

	it('skips scan paths that do not exist', async () => {
		const root = createScratchRoot();
		await expect(checkViteEnvAccessStyle({ scanPaths: [path.join(root, 'missing')] })).resolves.toStrictEqual([]);
	});
});

describe('describeViteEnvAccessStyleTests', () => {
	it('is the Vitest suite entrypoint for consumers', () => {
		expect(typeof describeViteEnvAccessStyleTests).toBe('function');
	});
});
