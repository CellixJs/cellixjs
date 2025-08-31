import { describe, it, expect } from 'vitest';

describe('index', () => {
  it('should export all required functions and types', async () => {
    const exported = await import('./index.js');

    // Schema building utilities
    expect(exported.createCellixSchema).toBeDefined();
    expect(exported.createCellixSchemaSimple).toBeDefined();
    expect(typeof exported.createCellixSchema).toBe('function');
    expect(typeof exported.createCellixSchemaSimple).toBe('function');

    // Resolver building utilities
    expect(exported.createResolverBuilders).toBeDefined();
    expect(typeof exported.createResolverBuilders).toBe('function');

    // GraphQL Scalars re-export
    expect(exported.GraphQLScalars).toBeDefined();
    expect(typeof exported.GraphQLScalars).toBe('object');

    // GraphQL Tools re-exports
    expect(exported.loadFilesSync).toBeDefined();
    expect(exported.mergeResolvers).toBeDefined();
    expect(exported.mergeTypeDefs).toBeDefined();
    expect(exported.makeExecutableSchema).toBeDefined();

    expect(typeof exported.loadFilesSync).toBe('function');
    expect(typeof exported.mergeResolvers).toBe('function');
    expect(typeof exported.mergeTypeDefs).toBe('function');
    expect(typeof exported.makeExecutableSchema).toBe('function');
  });

  it('should have proper TypeScript types available', async () => {
    // This test ensures TypeScript compilation works
    // and the types are properly exported
    const { createCellixSchema } = await import('./index.js');
    
    // Test that the function accepts the expected interface
    const mockResolvers = {
      Query: {
        hello: () => 'Hello World',
      },
    };

    const schema = createCellixSchema({
      resolvers: mockResolvers,
      customTypeDefs: 'type Query { hello: String }', // Add the Query type definition
    });

    expect(schema).toBeDefined();
  });
});