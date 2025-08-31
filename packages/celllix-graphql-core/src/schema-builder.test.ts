import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCellixSchema, createCellixSchemaSimple } from './schema-builder.js';
import type { BaseContext } from '@apollo/server';
import type { IResolvers } from '@graphql-tools/utils';

// Mock dependencies
vi.mock('@graphql-tools/load-files', () => ({
  loadFilesSync: vi.fn(() => ['type Query { hello: String, user: User, goodbye: String } type User { id: ID! }']),
}));

vi.mock('graphql-scalars', () => ({
  typeDefs: ['scalar DateTime', 'scalar ObjectID'],
  resolvers: {
    DateTime: {
      serialize: () => 'datetime',
      parseValue: () => new Date(),
      parseLiteral: () => new Date(),
    },
    ObjectID: {
      serialize: () => 'objectid',
      parseValue: () => 'objectid',
      parseLiteral: () => 'objectid',
    },
  },
}));

interface TestContext extends BaseContext {
  userId?: string;
}

describe('schema-builder', () => {
  const mockResolvers: IResolvers<unknown, TestContext> = {
    Query: {
      hello: () => 'Hello World',
      user: (_parent, _args, context) => ({ id: context.userId }),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCellixSchema', () => {
    it('should create a GraphQL schema with resolvers and scalars', () => {
      const schema = createCellixSchema({
        resolvers: mockResolvers,
      });

      expect(schema).toBeDefined();
      expect(schema.getQueryType()).toBeDefined();
    });

    it('should handle array of resolvers', () => {
      const additionalResolvers: IResolvers<unknown, TestContext> = {
        Query: {
          goodbye: () => 'Goodbye World',
        },
      };

      const schema = createCellixSchema({
        resolvers: [mockResolvers, additionalResolvers],
      });

      expect(schema).toBeDefined();
      expect(schema.getQueryType()).toBeDefined();
    });

    it('should include custom type definitions', () => {
      const customTypeDefs = 'type CustomType { id: ID!, name: String! }';

      const schema = createCellixSchema({
        resolvers: mockResolvers,
        customTypeDefs,
      });

      expect(schema).toBeDefined();
      expect(schema.getType('CustomType')).toBeDefined();
    });

    it('should handle array of custom type definitions', () => {
      const customTypeDefs = [
        'type CustomType { id: ID!, name: String! }',
        'type AnotherType { value: Int! }',
      ];

      const schema = createCellixSchema({
        resolvers: mockResolvers,
        customTypeDefs,
      });

      expect(schema).toBeDefined();
      expect(schema.getType('CustomType')).toBeDefined();
      expect(schema.getType('AnotherType')).toBeDefined();
    });

    it('should use custom schema files path when provided', () => {
      const schema = createCellixSchema({
        resolvers: mockResolvers,
        schemaFilesPath: '/custom/path/**/*.graphql',
      });

      expect(schema).toBeDefined();
    });

    it('should handle missing schema files gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
        // Intentionally empty
      });
      
      // Just test that schema can be created without schema files
      const schema = createCellixSchema({
        resolvers: mockResolvers,
        customTypeDefs: 'type Query { hello: String, user: User } type User { id: ID! }',
      });

      expect(schema).toBeDefined();
      consoleSpy.mockRestore();
    });

    it('should accept various schema options', () => {
      const schema = createCellixSchema({
        resolvers: mockResolvers,
        customTypeDefs: 'type TestType { value: String }',
        schemaFilesPath: '/custom/path/**/*.graphql',
      });

      expect(schema).toBeDefined();
    });

    it('should filter out falsy custom type definitions', () => {
      const schema = createCellixSchema({
        resolvers: mockResolvers,
        customTypeDefs: ['type ValidType { id: ID! }', '', null, undefined] as string[],
      });

      expect(schema).toBeDefined();
      expect(schema.getType('ValidType')).toBeDefined();
    });
  });

  describe('createCellixSchemaSimple', () => {
    it('should create a schema with single resolver object', () => {
      const schema = createCellixSchemaSimple(mockResolvers);

      expect(schema).toBeDefined();
      expect(schema.getQueryType()).toBeDefined();
    });

    it('should create a schema with array of resolvers', () => {
      const schema = createCellixSchemaSimple([mockResolvers]);

      expect(schema).toBeDefined();
      expect(schema.getQueryType()).toBeDefined();
    });

    it('should use custom schema files path when provided', () => {
      const schema = createCellixSchemaSimple(mockResolvers, '/custom/simple/path/**/*.graphql');

      expect(schema).toBeDefined();
    });
  });
});