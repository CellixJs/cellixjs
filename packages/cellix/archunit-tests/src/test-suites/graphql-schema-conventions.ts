import { describe, expect, it } from 'vitest';
import { checkGraphqlSchemaFileNaming, checkGraphqlSchemaInputNaming, checkGraphqlSchemaMutationResults, checkGraphqlSchemaOrdering, checkGraphqlSchemaTypePrefixing } from '../checks/graphql-schema-conventions.js';

export interface GraphqlSchemaConventionsTestsConfig {
	graphqlGlob: string;
	excludeFiles?: string[];
}

export function describeGraphqlSchemaConventionsTests(config: GraphqlSchemaConventionsTestsConfig): void {
	const checkConfig = {
		graphqlGlob: config.graphqlGlob,
		...(config.excludeFiles && { excludeFiles: config.excludeFiles }),
	};

	describe('GraphQL Schema Conventions', () => {
		describe('File Naming', () => {
			it('GraphQL schema files must use lower-kebab-case naming', async () => {
				const violations = await checkGraphqlSchemaFileNaming(checkConfig);
				expect(violations).toStrictEqual([]);
			});
		});

		describe('Type Prefixing', () => {
			it('types and inputs must be prefixed with the top-level type name derived from the file name', async () => {
				const violations = await checkGraphqlSchemaTypePrefixing(checkConfig);
				expect(violations).toStrictEqual([]);
			});
		});

		describe('Mutation Result Conventions', () => {
			it('MutationResult types must implement MutationResult and have status: MutationStatus!', async () => {
				const violations = await checkGraphqlSchemaMutationResults(checkConfig);
				const structureViolations = violations.filter((v) => v.includes('implement') || v.includes('status'));
				expect(structureViolations).toStrictEqual([]);
			});

			it('all mutations must return a MutationResult type', async () => {
				const violations = await checkGraphqlSchemaMutationResults(checkConfig);
				const returnTypeViolations = violations.filter((v) => v.includes('must return'));
				expect(returnTypeViolations).toStrictEqual([]);
			});
		});

		describe('Input Type Naming', () => {
			it('input types must end with "Input"', async () => {
				const violations = await checkGraphqlSchemaInputNaming(checkConfig);
				expect(violations).toStrictEqual([]);
			});
		});

		describe('Definition Ordering', () => {
			it('definitions must follow ordering: TopLevelType → SubTypes → Enums → Inputs → MutationResult → Query → Mutation', async () => {
				const violations = await checkGraphqlSchemaOrdering(checkConfig);
				expect(violations).toStrictEqual([]);
			});
		});
	});
}
