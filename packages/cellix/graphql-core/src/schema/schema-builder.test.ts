import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi, type MockedFunction } from 'vitest';
import { buildCellixSchema, loadResolversFromGlob } from './schema-builder.ts';
import type { IResolvers } from '@graphql-tools/utils';
import type { GraphQLSchema, DocumentNode } from 'graphql';

const test = { for: describeFeature };

// Mock dependencies
vi.mock('@graphql-tools/load-files', () => ({
  loadFilesSync: vi.fn(),
}));

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
const feature = await loadFeature(
  path.resolve(__dirname, 'features/schema-builder.feature')
);

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let loadFilesSync: MockedFunction<(...args: unknown[]) => unknown>;
  let mergeTypeDefs: MockedFunction<(...args: unknown[]) => unknown>;
  let mergeResolvers: MockedFunction<(...args: unknown[]) => unknown>;
  let makeExecutableSchema: MockedFunction<(...args: unknown[]) => unknown>;

  BeforeEachScenario(async () => {
    vi.clearAllMocks();

    // Get mocked functions
    const loadFiles = vi.mocked(await import('@graphql-tools/load-files'));
    const merge = vi.mocked(await import('@graphql-tools/merge'));
    const schema = vi.mocked(await import('@graphql-tools/schema'));

    loadFilesSync = loadFiles.loadFilesSync as MockedFunction<(...args: unknown[]) => unknown>;
    mergeTypeDefs = merge.mergeTypeDefs as MockedFunction<(...args: unknown[]) => unknown>;
    mergeResolvers = merge.mergeResolvers as MockedFunction<(...args: unknown[]) => unknown>;
    makeExecutableSchema = schema.makeExecutableSchema as MockedFunction<(...args: unknown[]) => unknown>;

    // Setup default mocks
    loadFilesSync.mockReturnValue(['type Query { hello: String }']);
    mergeTypeDefs.mockReturnValue({ kind: 'Document', definitions: [] } as DocumentNode);
    mergeResolvers.mockReturnValue({});
    makeExecutableSchema.mockReturnValue({} as GraphQLSchema);
  });

  Scenario('Building schema with no additional types or resolvers', ({ Given, When, Then, And }) => {
    let result: GraphQLSchema;

    Given('no additional type definitions or resolvers', () => {
      // No additional setup needed
    });

    When('buildCellixSchema is called', () => {
      result = buildCellixSchema();
    });

    Then('it should return a valid GraphQL schema', () => {
      expect(result).toBeDefined();
    });

    And('the schema should include base Cellix types', () => {
      expect(loadFilesSync).toHaveBeenCalledWith(path.resolve(__dirname, '../../src/schema/**/*.graphql'));
    });

    And('the schema should include GraphQL scalars', () => {
      expect(mergeTypeDefs).toHaveBeenCalledWith(
        expect.arrayContaining(['scalar DateTime'])
      );
    });
  });

  Scenario('Building schema with additional string type definitions', ({ Given, When, Then, And }) => {
    let result: GraphQLSchema;
    const additionalTypes = ['type CustomType { id: ID! }'];

    Given('additional type definitions as strings', () => {
      // Types are defined above
    });

    When('buildCellixSchema is called with the additional types', () => {
      result = buildCellixSchema(additionalTypes);
    });

    Then('it should return a valid GraphQL schema', () => {
      expect(result).toBeDefined();
    });

    And('the schema should include the additional types', () => {
      expect(mergeTypeDefs).toHaveBeenCalledWith(
        expect.arrayContaining(additionalTypes)
      );
    });
  });

  Scenario('Building schema with additional resolvers', ({ Given, When, Then, And }) => {
    let result: GraphQLSchema;
    const additionalResolvers: IResolvers[] = [{ Query: { hello: () => 'world' } }];

    Given('additional resolvers', () => {
      // Resolvers are defined above
    });

    When('buildCellixSchema is called with the additional resolvers', () => {
      result = buildCellixSchema([], additionalResolvers);
    });

    Then('it should return a valid GraphQL schema', () => {
      expect(result).toBeDefined();
    });

    And('the schema should include the additional resolvers', () => {
      expect(mergeResolvers).toHaveBeenCalledWith(
        expect.arrayContaining(additionalResolvers)
      );
    });
  });

  Scenario('Loading resolvers from glob pattern', ({ Given, When, Then }) => {
    let result: IResolvers;
    const globPattern = 'resolvers/**/*.ts';
    const mockResolver = { Query: { test: () => 'test' } };

    Given('a glob pattern for resolver files', () => {
      loadFilesSync.mockReturnValue([mockResolver]);
      mergeResolvers.mockReturnValue({ Query: { merged: true } });
    });

    When('loadResolversFromGlob is called', () => {
      result = loadResolversFromGlob(globPattern);
    });

    Then('it should return merged resolvers from the matched files', () => {
      expect(loadFilesSync).toHaveBeenCalledWith(globPattern);
      expect(mergeResolvers).toHaveBeenCalledWith([mockResolver]);
      expect(result).toEqual({ Query: { merged: true } });
    });
  });
});