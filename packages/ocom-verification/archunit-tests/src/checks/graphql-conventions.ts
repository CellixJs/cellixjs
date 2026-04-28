import * as path from 'node:path';
import { fileExists, getFilesMatching, readFile } from '../utils/source-files.js';

export function checkOComResolversHaveSchemaFiles(config: { resolversGlob: string }): string[] {
	const violations: string[] = [];

	for (const filePath of getFilesMatching(config.resolversGlob, '.resolvers.ts')) {
		const schemaPath = filePath.replace(/\.resolvers\.ts$/, '.graphql');
		if (!fileExists(schemaPath)) {
			violations.push(`[${filePath}] Resolver file must have a sibling .graphql schema file`);
		}
	}

	return violations;
}

export function checkOComSchemaFilesHaveResolvers(config: { graphqlGlob: string; excludeFiles?: string[] }): string[] {
	const violations: string[] = [];
	const excludedFiles = new Set(config.excludeFiles ?? []);

	for (const filePath of getFilesMatching(config.graphqlGlob, '.graphql')) {
		if (excludedFiles.has(path.basename(filePath))) {
			continue;
		}

		const content = readFile(filePath);
		const exposesTopLevelOperations = /(?:^|\n)\s*(?:extend\s+)?type\s+(?:Query|Mutation)\b/m.test(content);
		if (!exposesTopLevelOperations) {
			continue;
		}

		const resolverPath = filePath.replace(/\.graphql$/, '.resolvers.ts');
		if (!fileExists(resolverPath)) {
			violations.push(`[${filePath}] GraphQL schema file must have a sibling .resolvers.ts file`);
		}
	}

	return violations;
}
