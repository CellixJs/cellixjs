import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import type { GraphContext } from '../context.ts';
import endUserResolvers from './end-user.resolvers.ts';
import {
  type FieldNode,
  type GraphQLResolveInfo,
  type GraphQLObjectType,
  type GraphQLSchema,
  type OperationDefinitionNode,
  Kind,
} from 'graphql';

// Mock the resolver helper

const test = { for: describeFeature };
vi.mock('@cellix/graphql-core', () => ({
  getRequestedFieldPaths: vi.fn().mockReturnValue(['id', 'email']),
}));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/end-user.resolvers.feature')
);

// Types for test results
type EndUserEntity = Domain.Contexts.User.EndUser.EndUserEntityReference;

// Helper function to create mock end user
function createMockEndUser(overrides: Partial<EndUserEntity> = {}): EndUserEntity {
  const baseEndUser: EndUserEntity = {
    id: 'mock-end-user-id',
    externalId: 'mock-external-id',
    displayName: 'Mock User',
    accessBlocked: false,
    tags: [],
    userType: 'endUser',
    email: 'mock@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    schemaVersion: '1.0',
    personalInformation: {
      contactInformation: {
        email: 'mock@example.com',
      },
      identityDetails: {
        lastName: 'User',
        legalNameConsistsOfOneName: false,
        restOfName: 'Mock',
      },
    },
    ...overrides,
  };
  return baseEndUser;
}

// Mocks
vi.mock('@ocom/domain', () => ({
  Domain: {
    Contexts: {
      User: {
        EndUser: {
          EndUserEntityReference: vi.fn(),
        },
      },
    },
  },
}));

function makeMockGraphContext(overrides: Partial<GraphContext> = {}): GraphContext {
  return {
    applicationServices: {
      User: {
        EndUser: {
          createIfNotExists: vi.fn(),
          queryById: vi.fn(),
        },
      },
      verifiedUser: {
        verifiedJwt: {
          sub: 'default-user-sub',
          family_name: 'Doe',
          given_name: 'John',
          email: 'john@example.com',
        },
      },
      ...overrides.applicationServices,
    },
    ...overrides,
  } as GraphContext;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let context: GraphContext;
  let result: EndUserEntity | null;

  BeforeEachScenario(() => {
    context = makeMockGraphContext();
    vi.clearAllMocks();
  });

  Scenario('Querying the current end user and creating if not exists', ({ Given, When, Then, And }) => {
    const mockEndUser = createMockEndUser();

    Given('a user with a verifiedUser and a verifiedJwt in their context', () => {
      // Already set up in BeforeEachScenario
    });

    When('the currentEndUserAndCreateIfNotExists query is executed', async () => {
      vi.mocked(context.applicationServices.User.EndUser.createIfNotExists).mockResolvedValue(mockEndUser);
      const mockFieldNode: FieldNode = {
        kind: Kind.FIELD,
        name: { kind: Kind.NAME, value: 'currentEndUserAndCreateIfNotExists' },
      };
      const mockInfo: GraphQLResolveInfo = {
        fieldName: 'currentEndUserAndCreateIfNotExists',
        fieldNodes: [mockFieldNode],
        returnType: {} as GraphQLObjectType,
        parentType: {} as GraphQLObjectType,
        path: { key: 'currentEndUserAndCreateIfNotExists', prev: undefined, typename: undefined },
        schema: {} as GraphQLSchema,
        fragments: {},
        rootValue: {},
        operation: {} as OperationDefinitionNode,
        variableValues: {},
      };
      result = await (endUserResolvers.Query?.currentEndUserAndCreateIfNotExists as unknown as (parent: object, args: Record<string, never>, context: GraphContext, info: GraphQLResolveInfo) => Promise<EndUserEntity | null>)({}, {}, context, mockInfo);
    });

    Then('it should call User.EndUser.createIfNotExists with the user\'s sub, family_name, given_name, and email', () => {
      expect(context.applicationServices.User.EndUser.createIfNotExists).toHaveBeenCalledWith({
        externalId: 'default-user-sub',
        lastName: 'Doe',
        restOfName: 'John',
        email: 'john@example.com',
      });
    });

    And('it should return the corresponding EndUser entity', () => {
      expect(result).toEqual(mockEndUser);
    });
  });

  Scenario('Querying an end user by ID', ({ Given, When, Then, And }) => {
    const endUserId = 'end-user-123';
    const mockEndUser = createMockEndUser({ id: endUserId, displayName: 'End User 123' });

    Given('a valid end user ID', () => {
      // endUserId is defined
    });

    When('the endUserById query is executed with that ID', async () => {
      vi.mocked(context.applicationServices.User.EndUser.queryById).mockResolvedValue(mockEndUser);
      const mockFieldNode: FieldNode = {
        kind: Kind.FIELD,
        name: { kind: Kind.NAME, value: 'endUserById' },
      };
      const mockInfo: GraphQLResolveInfo = {
        fieldName: 'endUserById',
        fieldNodes: [mockFieldNode],
        returnType: {} as GraphQLObjectType,
        parentType: {} as GraphQLObjectType,
        path: { key: 'endUserById', prev: undefined, typename: undefined },
        schema: {} as GraphQLSchema,
        fragments: {},
        rootValue: {},
        operation: {} as OperationDefinitionNode,
        variableValues: {},
      };
      result = await (endUserResolvers.Query?.endUserById as unknown as (parent: object, args: { id: string }, context: GraphContext, info: GraphQLResolveInfo) => Promise<EndUserEntity | null>)({}, { id: endUserId }, context, mockInfo);
    });

    Then('it should call User.EndUser.queryById with the provided ID and requested fields', () => {
      expect(context.applicationServices.User.EndUser.queryById).toHaveBeenCalledWith({
        id: endUserId,
        fields: ['id', 'email'],
      });
    });

    And('it should return the corresponding EndUser entity', () => {
      expect(result).toEqual(mockEndUser);
    });
  });

  Scenario('Unauthorized access to currentEndUserAndCreateIfNotExists', ({ Given, When, Then }) => {
    Given('a user without a verifiedJwt in their context', () => {
      if (context.applicationServices.verifiedUser) {
        context.applicationServices.verifiedUser.verifiedJwt = undefined;
      }
    });

    When('the currentEndUserAndCreateIfNotExists query is executed', async () => {
      const mockFieldNode: FieldNode = {
        kind: Kind.FIELD,
        name: { kind: Kind.NAME, value: 'currentEndUserAndCreateIfNotExists' },
      };
      const mockInfo: GraphQLResolveInfo = {
        fieldName: 'currentEndUserAndCreateIfNotExists',
        fieldNodes: [mockFieldNode],
        returnType: {} as GraphQLObjectType,
        parentType: {} as GraphQLObjectType,
        path: { key: 'currentEndUserAndCreateIfNotExists', prev: undefined, typename: undefined },
        schema: {} as GraphQLSchema,
        fragments: {},
        rootValue: {},
        operation: {} as OperationDefinitionNode,
        variableValues: {},
      };
      await expect((endUserResolvers.Query?.currentEndUserAndCreateIfNotExists as unknown as (parent: object, args: Record<string, never>, context: GraphContext, info: GraphQLResolveInfo) => Promise<EndUserEntity | null>)({}, {}, context, mockInfo)).rejects.toThrow('Unauthorized');
    });

    Then('it should throw an "Unauthorized" error', () => {
      // Already checked in When
    });
  });
});