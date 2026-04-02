import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi, type MockedFunction } from 'vitest';
import { buildCellixSchema } from './schema-builder.js';
import { baseCellixTypeDefs } from '@cellix/graphql-core';
import type { IResolvers } from '@graphql-tools/utils';
import type { GraphQLSchema, DocumentNode } from 'graphql';

const test = { for: describeFeature };

vi.mock('@graphql-tools/merge', () => ({
	mergeTypeDefs: vi.fn(),
	mergeResolvers: vi.fn(),
}));

vi.mock('@graphql-tools/schema', () => ({
	makeExecutableSchema: vi.fn(),
}));

vi.mock('graphql-scalars', () => ({
	typeDefs: ['scalar DateTime'],
	resolvers: { DateTime: {} },
}));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/schema-builder.feature'));

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let mergeTypeDefs: MockedFunction<(...args: unknown[]) => unknown>;
	let mergeResolvers: MockedFunction<(...args: unknown[]) => unknown>;
	let makeExecutableSchema: MockedFunction<(...args: unknown[]) => unknown>;

	BeforeEachScenario(async () => {
		vi.clearAllMocks();

		const merge = vi.mocked(await import('@graphql-tools/merge'));
		const schema = vi.mocked(await import('@graphql-tools/schema'));

		mergeTypeDefs = merge.mergeTypeDefs as MockedFunction<(...args: unknown[]) => unknown>;
		mergeResolvers = merge.mergeResolvers as MockedFunction<(...args: unknown[]) => unknown>;
		makeExecutableSchema = schema.makeExecutableSchema as MockedFunction<(...args: unknown[]) => unknown>;

		mergeTypeDefs.mockReturnValue({ kind: 'Document', definitions: [] } as DocumentNode);
		mergeResolvers.mockReturnValue({});
		makeExecutableSchema.mockReturnValue({} as GraphQLSchema);
	});

	Scenario('Building schema with no additional types or resolvers', ({ Given, When, Then, And }) => {
		let result: GraphQLSchema;

		Given('no additional type definitions or resolvers', () => {
			// no setup needed
		});

		When('buildCellixSchema is called', () => {
			result = buildCellixSchema();
		});

		Then('it should return a valid GraphQL schema', () => {
			expect(result).toBeDefined();
		});

		And('the schema should include base Cellix types', () => {
			expect(mergeTypeDefs).toHaveBeenCalledWith(expect.arrayContaining([...baseCellixTypeDefs]));
		});

		And('the schema should include GraphQL scalars', () => {
			expect(mergeTypeDefs).toHaveBeenCalledWith(expect.arrayContaining(['scalar DateTime']));
		});
	});

	Scenario('Building schema with additional string type definitions', ({ Given, When, Then, And }) => {
		let result: GraphQLSchema;
		const additionalTypes = ['type CustomType { id: ID! }'];

		Given('additional type definitions as strings', () => {
			// types defined above
		});

		When('buildCellixSchema is called with the additional types', () => {
			result = buildCellixSchema(additionalTypes);
		});

		Then('it should return a valid GraphQL schema', () => {
			expect(result).toBeDefined();
		});

		And('the schema should include the additional types', () => {
			expect(mergeTypeDefs).toHaveBeenCalledWith(expect.arrayContaining(additionalTypes));
		});
	});

	Scenario('Building schema with additional resolvers', ({ Given, When, Then, And }) => {
		let result: GraphQLSchema;
		const additionalResolvers: IResolvers[] = [{ Query: { hello: () => 'world' } }];

		Given('additional resolvers', () => {
			// resolvers defined above
		});

		When('buildCellixSchema is called with the additional resolvers', () => {
			result = buildCellixSchema([], additionalResolvers);
		});

		Then('it should return a valid GraphQL schema', () => {
			expect(result).toBeDefined();
		});

		And('the schema should include the additional resolvers', () => {
			expect(mergeResolvers).toHaveBeenCalledWith(expect.arrayContaining(additionalResolvers));
		});
	});
});
