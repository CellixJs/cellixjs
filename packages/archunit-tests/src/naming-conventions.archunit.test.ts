import { projectFiles } from 'archunit';
import { readdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const graphqlSchemaTypesRoot = join(
	__dirname,
	'../../ocom/graphql/src/schema/types',
);

const allowedSchemaTypeFileSuffixes = [
	'.resolvers.ts',
	'.graphql',
	'.resolvers.test.ts',
];

const collectFilesRecursively = async (directoryPath: string): Promise<string[]> => {
	const directoryEntries = await readdir(directoryPath, { withFileTypes: true });
	const nestedResults = await Promise.all(
		directoryEntries.map((directoryEntry) => {
			const absoluteEntryPath = join(directoryPath, directoryEntry.name);

			if (directoryEntry.isDirectory()) {
				return collectFilesRecursively(absoluteEntryPath);
			}

			if (directoryEntry.isFile()) {
				return [absoluteEntryPath];
			}

			return [];
		}),
	);

	return nestedResults.flat();
};

describe('Naming Conventions', () => {
	it('graphql schema type files must live directly in schema/types and use approved suffixes', async () => {
		const allFilesInSchemaTypes = await collectFilesRecursively(graphqlSchemaTypesRoot);

		const filePathsOutsideTypesRoot = allFilesInSchemaTypes.filter((filePath) => {
			const relativeFilePath = relative(graphqlSchemaTypesRoot, filePath);
			const relativeDirectoryPath = dirname(relativeFilePath);
			return relativeDirectoryPath !== '.' && relativeDirectoryPath !== 'features' && !relativeDirectoryPath.startsWith('features/');
		});

		expect(filePathsOutsideTypesRoot).toEqual([]);

		const directChildDirectories = (await readdir(graphqlSchemaTypesRoot, { withFileTypes: true }))
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name);

		expect(directChildDirectories).toEqual(['features']);

		const filesOutsideFeatures = allFilesInSchemaTypes.filter((filePath) => {
			const relativeFilePath = relative(graphqlSchemaTypesRoot, filePath);
			return !relativeFilePath.startsWith('features/');
		});

		const filesWithInvalidSuffix = filesOutsideFeatures.filter(
			(filePath) => !allowedSchemaTypeFileSuffixes.some((suffix) => filePath.endsWith(suffix)),
		);

		expect(filesWithInvalidSuffix).toEqual([]);

		const directTypeFiles = filesOutsideFeatures.filter(
			(filePath) => dirname(relative(graphqlSchemaTypesRoot, filePath)) === '.',
		);

		expect(directTypeFiles.length).toBeGreaterThan(0);
	});

	it.skip('UI graphql files must be named *.container.graphql', async () => {
		// Broadly match any .graphql file under any `src` folder across the repo.
		// This is intentionally permissive so new UI packages are automatically covered.
		// Restrict to UI packages only. UI packages in this repo follow the
		// pattern `ui-*` and exist under packages/*/ui-* and apps/ui-*
		// Examples: packages/cellix/ui-core, packages/ocom/ui-components, apps/ui-community
		const rule = projectFiles()
			// Match files that live inside a ui-* package's src folder.
			// inFolder matches the folder path (without filename) so it's
			// resilient to test CWD differences.
			.inFolder('**/ui-*/src/**')
			.withName('*.graphql')
			.should()
			.haveName('*.container.graphql');

		// Keep this strict: if the pattern is wrong (matches nothing) the test
		// will fail so we can notice and correct the glob. If you prefer a
		// non-blocking rule in CI for empty checkouts, pass { allowEmptyTests: true }.
		await expect(rule).toPassAsync();
	});
});