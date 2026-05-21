import { describe, it } from 'vitest';
import { checkGraphqlFileNaming } from '../checks/naming-conventions.js';

export function describeNamingConventionTests(): void {
	describe('Naming Conventions', () => {
		describe('GraphQL Files', () => {
			it('GraphQL files should use .container.graphql naming', async () => {
				await checkGraphqlFileNaming({
					graphqlFilePaths: ['../graphql/src/**/*.graphql'],
				});
			});

			it('GraphQL files should be in proper directories', async () => {
				await checkGraphqlFileNaming({
					graphqlFilePaths: ['../graphql/src/**/*.graphql'],
				});
			});
		});

		describe('TypeScript Files', () => {
			it.skip('domain files should follow TypeScript naming conventions', async () => {
				// Placeholder for future implementation
			});

			it.skip('resolver files should follow TypeScript naming conventions', async () => {
				// Placeholder for future implementation
			});
		});
	});
}
