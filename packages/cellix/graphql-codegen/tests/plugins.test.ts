import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { plugin as resolverManifestPlugin } from '../plugins/resolver-manifest-plugin.mjs';
import { plugin as staticTypeDefsPlugin } from '../plugins/static-type-defs-plugin.mjs';

const originalCwd = process.cwd();
const tempRoots: string[] = [];

describe('@cellix/graphql-codegen plugins', () => {
	afterEach(async () => {
		process.chdir(originalCwd);
		await Promise.all(tempRoots.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
	});

	it('static-type-defs plugin requires sourceDir and exportName', async () => {
		await expect(staticTypeDefsPlugin({}, [], {})).rejects.toThrow(
			'static-type-defs-plugin: "sourceDir" and "exportName" config options are required',
		);
	});

	it('static-type-defs plugin emits a sorted static type-def array', async () => {
		const repoRoot = await createTempRoot();

		await writeFiles(repoRoot, {
			'schema/b.graphql': 'type B { id: ID! }\n',
			'schema/nested/a.graphql': 'type A { id: ID! }\n',
			'schema/ignore.txt': 'ignore me\n',
		});
		process.chdir(repoRoot);

		const output = await staticTypeDefsPlugin({}, [], {
			sourceDir: 'schema',
			exportName: 'myTypeDefs',
		});

		expect(output).toContain('export const myTypeDefs = [');
		expect(output).toContain(String.raw`"type A { id: ID! }\n", // schema/nested/a.graphql`);
		expect(output).toContain(String.raw`"type B { id: ID! }\n", // schema/b.graphql`);
		expect(output.indexOf('schema/b.graphql')).toBeLessThan(
			output.indexOf('schema/nested/a.graphql'),
		);
	});

	it('static-type-defs plugin handles sourceDir with no .graphql files', async () => {
		const repoRoot = await createTempRoot();

		await writeFiles(repoRoot, {
			'schema/README.md': '# no graphql files here\n',
			'schema/ignored.txt': 'not graphql\n',
		});
		process.chdir(repoRoot);

		const output = await staticTypeDefsPlugin({}, [], {
			sourceDir: 'schema',
			exportName: 'staticTypeDefs',
		});

		expect(typeof output).toBe('string');
		expect(output).toContain('export const staticTypeDefs = [');
		expect(output).toContain('] as const;');
		expect(output).not.toMatch(/\/\/ schema\//);
	});

	it('resolver-manifest plugin requires typesDir', async () => {
		await expect(resolverManifestPlugin({}, [], {} as never)).rejects.toThrow(
			'resolver-manifest-plugin: "typesDir" config option is required',
		);
	});

	it('resolver-manifest plugin emits static imports and custom export names', async () => {
		const repoRoot = await createTempRoot();

		await writeFiles(repoRoot, {
			'src/schema/types/z.permissions.ts': 'export default "z-permission";\n',
			'src/schema/types/nested/a.resolvers.ts': 'export default { Query: {} };\n',
			'src/schema/types/b.resolvers.ts': 'export default { Mutation: {} };\n',
		});
		process.chdir(repoRoot);

		const output = await resolverManifestPlugin(
			{},
			[],
			{
				typesDir: 'src/schema/types',
				resolversExportName: 'myResolvers',
				permissionsExportName: 'myPermissions',
			},
			{ outputFile: 'src/schema/builder/resolver-manifest.generated.ts' },
		);

		expect(output).toContain(
			"import resolver0 from '../types/b.resolvers.ts';",
		);
		expect(output).toContain(
			"import resolver1 from '../types/nested/a.resolvers.ts';",
		);
		expect(output).toContain(
			"import permission0 from '../types/z.permissions.ts';",
		);
		expect(output).toContain('export const myResolvers = [');
		expect(output).toContain('\tresolver0,');
		expect(output).toContain('\tresolver1,');
		expect(output).toContain('export const myPermissions = [');
		expect(output).toContain('\tpermission0,');
	});

	it('resolver-manifest plugin handles typesDir with no resolver or permission files', async () => {
		const repoRoot = await createTempRoot();

		await writeFiles(repoRoot, {
			'schema/types/User.ts': 'export interface User { id: string }\n',
			'schema/README.md': '# no resolvers here\n',
		});
		process.chdir(repoRoot);

		const output = await resolverManifestPlugin(
			{},
			[],
			{
				typesDir: 'schema/types',
			},
			{ outputFile: 'src/__generated__/resolver-manifest.ts' },
		);

		expect(typeof output).toBe('string');
		expect(output).toContain('export const resolvers = [');
		expect(output).toContain('export const permissions = [');
		expect(output).toMatch(/\bresolvers\s*=\s*\[\s*\]/);
		expect(output).toMatch(/\bpermissions\s*=\s*\[\s*\]/);
		expect(output).not.toMatch(/\bfrom\s+['"].+['"]/);
	});

	it('resolver-manifest plugin supports the default fallback output location', async () => {
		const repoRoot = await createTempRoot();

		await writeFiles(repoRoot, {
			'src/schema/types/example.resolvers.ts': 'export default { Query: {} };\n',
		});
		process.chdir(repoRoot);

		const output = await resolverManifestPlugin(
			{},
			[],
			{
				typesDir: 'src/schema/types',
			},
			undefined,
		);

		expect(output).toContain(
			"import resolver0 from '../types/example.resolvers.ts';",
		);
		expect(output).toContain('export const resolvers = [');
		expect(output).toContain('export const permissions = [');
	});
});

async function createTempRoot(): Promise<string> {
	const tempRoot = await fs.mkdtemp(path.join(originalCwd, '.tmp-graphql-codegen-'));
	tempRoots.push(tempRoot);
	return tempRoot;
}

async function writeFiles(rootDir: string, files: Record<string, string>): Promise<void> {
	for (const [relativePath, content] of Object.entries(files)) {
		const filePath = path.join(rootDir, relativePath);
		await fs.mkdir(path.dirname(filePath), { recursive: true });
		await fs.writeFile(filePath, content);
	}
}
