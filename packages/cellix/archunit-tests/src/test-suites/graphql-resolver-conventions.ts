import { describe, expect, it } from 'vitest';
import { checkGraphqlFlatStructure, checkGraphqlResolverContent, checkGraphqlResolverDependencies } from '../checks/graphql-resolver-conventions.js';

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

export function describeGraphqlResolverConventionsTests(config: GraphqlResolverConventionsTestsConfig, flatStructureConfig?: GraphqlFlatStructureTestsConfig): void {
	describe('GraphQL Resolver Conventions', () => {
		describe('Dependency Rules', () => {
			it('resolver files should not import domain entities directly', async () => {
				const violations = await checkGraphqlResolverDependencies({
					resolversGlob: config.resolversGlob,
					entityFilesPattern: config.entityFilesPattern,
				});
				expect(violations).toStrictEqual([]);
			}, 30000);

			it('resolver files should not import repositories directly', async () => {
				const violations = await checkGraphqlResolverDependencies({
					resolversGlob: config.resolversGlob,
					repositoryFilesPattern: config.repositoryFilesPattern,
				});
				expect(violations).toStrictEqual([]);
			}, 30000);

			it('resolver files should not import Unit of Work classes directly', async () => {
				const violations = await checkGraphqlResolverDependencies({
					resolversGlob: config.resolversGlob,
					uowFilesPattern: config.uowFilesPattern,
				});
				expect(violations).toStrictEqual([]);
			}, 30000);

			it('resolver files should not import infrastructure services directly', async () => {
				const violations = await checkGraphqlResolverDependencies({
					resolversGlob: config.resolversGlob,
					...(config.infrastructureServicesPattern && { infrastructureServicesPattern: config.infrastructureServicesPattern }),
				});
				expect(violations).toStrictEqual([]);
			}, 30000);

			it('resolver files should not import persistence layer directly', async () => {
				const violations = await checkGraphqlResolverDependencies({
					resolversGlob: config.resolversGlob,
					...(config.persistenceFolder && { persistenceFolder: config.persistenceFolder }),
				});
				expect(violations).toStrictEqual([]);
			}, 30000);
		});

		describe('Content Patterns', () => {
			it('resolver files must export a default object', async () => {
				const violations = await checkGraphqlResolverContent({
					resolversGlob: config.resolversGlob,
				});
				expect(violations.filter((v) => v.includes('default'))).toStrictEqual([]);
			}, 30000);

			it('resolver files should not define extra interfaces, types, classes, or enums', async () => {
				const violations = await checkGraphqlResolverContent({
					resolversGlob: config.resolversGlob,
				});
				expect(violations.filter((v) => v.includes('disallowed'))).toStrictEqual([]);
			}, 30000);

			it('resolver objects should be typed as Resolvers', async () => {
				const violations = await checkGraphqlResolverContent({
					resolversGlob: config.resolversGlob,
				});
				expect(violations.filter((v) => v.includes('Resolvers'))).toStrictEqual([]);
			}, 30000);

			it('resolver context parameter must be typed as GraphContext', async () => {
				const violations = await checkGraphqlResolverContent({
					resolversGlob: config.resolversGlob,
				});
				expect(violations.filter((v) => v.includes('GraphContext'))).toStrictEqual([]);
			}, 30000);

			it('resolver functions should be declared as async', async () => {
				const violations = await checkGraphqlResolverContent({
					resolversGlob: config.resolversGlob,
				});
				expect(violations.filter((v) => v.includes('async'))).toStrictEqual([]);
			}, 30000);
		});

		if (flatStructureConfig) {
			describe('Flat Structure', () => {
				it('types directory should not contain unexpected subdirectories', async () => {
					const { typesDirectoryPath, allowedSubdirectories } = flatStructureConfig;
					const violations = await checkGraphqlFlatStructure({
						typesDirectoryPath,
						...(allowedSubdirectories && { allowedSubdirectories }),
					});
					expect(violations).toStrictEqual([]);
				});
			});
		}
	});
}
