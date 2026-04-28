import { describe, expect, it } from 'vitest';
import { checkOComResolversHaveSchemaFiles } from '../checks/graphql-conventions.js';

export interface GraphqlResolverConventionsTestsConfig {
	resolversGlob: string;
	entityFilesPattern: string;
	repositoryFilesPattern: string;
	uowFilesPattern: string;
	infrastructureServicesPattern?: string;
	persistenceFolder?: string;
}

export interface GraphqlFlatStructureTestsConfig {
	typesDirectoryPath: string;
	allowedSubdirectories?: string[];
}

export function describeGraphqlResolverConventionsTests(config: GraphqlResolverConventionsTestsConfig, _flatStructureConfig?: GraphqlFlatStructureTestsConfig): void {
	describe('OCom GraphQL Resolver Conventions', () => {
		it('resolver files must have sibling schema files', async () => {
			const violations = await checkOComResolversHaveSchemaFiles({
				resolversGlob: config.resolversGlob,
			});
			expect(violations).toStrictEqual([]);
		}, 30000);
	});
}
