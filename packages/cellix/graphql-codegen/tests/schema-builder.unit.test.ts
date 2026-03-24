import type { IResolvers } from '@graphql-tools/utils';
import type { DocumentNode, GraphQLSchema } from 'graphql';
import { afterEach, describe, expect, it, vi, type MockedFunction } from 'vitest';
import { buildCellixSchema } from '../src/schema-builder.js';

vi.mock('@graphql-tools/merge', () => ({
	mergeTypeDefs: vi.fn(),
	mergeResolvers: vi.fn(),
}));

vi.mock('@graphql-tools/schema', () => ({
	makeExecutableSchema: vi.fn(),
}));

vi.mock('graphql-scalars', () => ({
	typeDefs: ['scalar DateTime'],
	resolvers: { DateTime: { __serialize: vi.fn() } },
}));

describe('buildCellixSchema', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it('wraps a single type definition and passes merged outputs to makeExecutableSchema', async () => {
		const merge = vi.mocked(await import('@graphql-tools/merge'));
		const schema = vi.mocked(await import('@graphql-tools/schema'));
		const mergeTypeDefs = merge.mergeTypeDefs as MockedFunction<(...args: unknown[]) => unknown>;
		const mergeResolvers = merge.mergeResolvers as MockedFunction<(...args: unknown[]) => unknown>;
		const makeExecutableSchema = schema.makeExecutableSchema as MockedFunction<
			(...args: unknown[]) => unknown
		>;
		const mergedTypeDefs = { kind: 'Document', definitions: [] } as DocumentNode;
		const mergedResolvers = { Query: { ping: () => 'pong' } };
		const builtSchema = { kind: 'schema' } as GraphQLSchema;
		const additionalTypeDef = 'type Query { ping: String! }';
		const additionalResolvers: IResolvers[] = [mergedResolvers];

		mergeTypeDefs.mockReturnValue(mergedTypeDefs);
		mergeResolvers.mockReturnValue(mergedResolvers);
		makeExecutableSchema.mockReturnValue(builtSchema);

		const result = buildCellixSchema(additionalTypeDef, additionalResolvers);

		expect(result).toBe(builtSchema);
		expect(mergeTypeDefs).toHaveBeenCalledWith(
			expect.arrayContaining(['scalar DateTime', additionalTypeDef]),
		);
		expect(mergeResolvers).toHaveBeenCalledWith(
			expect.arrayContaining([{ DateTime: expect.any(Object) }, ...additionalResolvers]),
		);
		expect(makeExecutableSchema).toHaveBeenCalledWith({
			typeDefs: mergedTypeDefs,
			resolvers: mergedResolvers,
		});
	});
});
