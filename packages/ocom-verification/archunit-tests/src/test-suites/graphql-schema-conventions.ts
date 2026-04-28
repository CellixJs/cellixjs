import { describe, expect, it } from 'vitest';
import { checkOComSchemaFilesHaveResolvers } from '../checks/graphql-conventions.js';

export interface GraphqlSchemaConventionsTestsConfig {
	graphqlGlob: string;
	excludeFiles?: string[];
}

export function describeGraphqlSchemaConventionsTests(config: GraphqlSchemaConventionsTestsConfig): void {
	describe('OCom GraphQL Schema Conventions', () => {
		it('schema files must have sibling resolver files unless explicitly excluded', async () => {
			const violations = await checkOComSchemaFilesHaveResolvers(config);
			expect(violations).toStrictEqual([]);
		}, 30000);
	});
}
