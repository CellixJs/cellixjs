import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import type { GraphContext } from '../../init/context.ts';
import type { CommunityCreateInput } from '../builder/generated.ts';
import communityResolvers from './community.resolvers.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/community.resolvers.feature')
);

// Types for test results
type CommunityEntity = import('@ocom/domain').CommunityEntityReference;

// Helper function to create mock community
function createMockCommunity(overrides: Partial<CommunityEntity> = {}): CommunityEntity {
  const baseCommunity: CommunityEntity = {
    id: 'mock-community-id',
    name: 'Mock Community',
    domain: 'mock.com',
    whiteLabelDomain: null,
    handle: null,
    createdBy: {
      id: 'mock-user-id',
      displayName: 'Mock User',
      externalId: 'mock-external-id',
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
    },
    loadCreatedBy: vi.fn().mockResolvedValue({
      id: 'mock-user-id',
      displayName: 'Mock User',
      externalId: 'mock-external-id',
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
    }),
    createdAt: new Date(),
    updatedAt: new Date(),
    schemaVersion: '1.0',
    ...overrides,
  };
  return baseCommunity;
}

// Mocks
vi.mock('@ocom/domain', () => ({
  Domain: {
    Contexts: {
      Community: {
        Community: {
          CommunityEntityReference: vi.fn(),
        },
      },
    },
  },
}));

function makeMockGraphContext(overrides: Partial<GraphContext> = {}): GraphContext {
  return {
    applicationServices: {
      Community: {
        Community: {
          queryById: vi.fn(),
          queryByEndUserExternalId: vi.fn(),
          create: vi.fn(),
        },
      },
      verifiedUser: {
        hints: {
          communityId: 'default-community-id',
        },
        verifiedJwt: {
          sub: 'default-user-sub',
        },
      },
      ...overrides.applicationServices,
    },
    ...overrides,
  } as GraphContext;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let context: GraphContext;
  let result: CommunityEntity | CommunityEntity[] | { status: { success: boolean; errorMessage?: string }; community?: CommunityEntity } | null;

  BeforeEachScenario(() => {
    context = makeMockGraphContext();
    vi.clearAllMocks();
  });

  Scenario('Querying the current community', ({ Given, When, Then, And }) => {
    const mockCommunity = createMockCommunity();

    Given('a user with a verifiedUser and a communityId in their context', () => {
      // Already set up in BeforeEachScenario
    });

    When('the currentCommunity query is executed', async () => {
      vi.mocked(context.applicationServices.Community.Community.queryById).mockResolvedValue(mockCommunity);
      result = await (communityResolvers.Query?.currentCommunity as unknown as (parent: unknown, args: Record<string, never>, context: GraphContext, info: unknown) => Promise<CommunityEntity | null>)(null, {}, context, {});
    });

    Then('it should call Community.Community.queryById with the user\'s communityId', () => {
      expect(context.applicationServices.Community.Community.queryById).toHaveBeenCalledWith({
        id: 'default-community-id',
      });
    });

    And('it should return the corresponding Community entity', () => {
      expect(result).toEqual(mockCommunity);
    });
  });

  Scenario('Querying a community by ID', ({ Given, When, Then, And }) => {
    const communityId = 'community-123';
    const mockCommunity = createMockCommunity({ id: communityId, name: 'Community 123' });

    Given('a valid community ID', () => {
      // communityId is defined
    });

    When('the communityById query is executed with that ID', async () => {
      vi.mocked(context.applicationServices.Community.Community.queryById).mockResolvedValue(mockCommunity);
      result = await (communityResolvers.Query?.communityById as unknown as (parent: unknown, args: { id: string }, context: GraphContext, info: unknown) => Promise<CommunityEntity | null>)(null, { id: communityId }, context, {});
    });

    Then('it should call Community.Community.queryById with the provided ID', () => {
      expect(context.applicationServices.Community.Community.queryById).toHaveBeenCalledWith({
        id: communityId,
      });
    });

    And('it should return the corresponding Community entity', () => {
      expect(result).toEqual(mockCommunity);
    });
  });

  Scenario('Querying communities for the current end user', ({ Given, When, Then, And }) => {
    const mockCommunities = [createMockCommunity({ id: 'comm-1' }), createMockCommunity({ id: 'comm-2' })];

    Given('a user with a verifiedUser and a verifiedJwt in their context', () => {
      // Already set up
    });

    When('the communitiesForCurrentEndUser query is executed', async () => {
      vi.mocked(context.applicationServices.Community.Community.queryByEndUserExternalId).mockResolvedValue(mockCommunities);
      result = await (communityResolvers.Query?.communitiesForCurrentEndUser as unknown as (parent: unknown, args: Record<string, never>, context: GraphContext, info: unknown) => Promise<CommunityEntity[]>)(null, {}, context, {});
    });

    Then('it should call Community.Community.queryByEndUserExternalId with the user\'s sub', () => {
      expect(context.applicationServices.Community.Community.queryByEndUserExternalId).toHaveBeenCalledWith({
        externalId: 'default-user-sub',
      });
    });

    And('it should return a list of Community entities', () => {
      expect(result).toEqual(mockCommunities);
    });
  });

  Scenario('Creating a community', ({ Given, And, When, Then }) => {
    const input: CommunityCreateInput = { name: 'New Community' };
    const mockCreatedCommunity = createMockCommunity({ id: 'new-comm', name: input.name });

    Given('a user with a verifiedUser and a verifiedJwt in their context', () => {
      // Already set up
    });

    And('a valid CommunityCreateInput', () => {
      // input is defined
    });

    When('the communityCreate mutation is executed with the input', async () => {
      vi.mocked(context.applicationServices.Community.Community.create).mockResolvedValue(mockCreatedCommunity);
      result = await (communityResolvers.Mutation?.communityCreate as unknown as (parent: unknown, args: { input: CommunityCreateInput }, context: GraphContext, info?: unknown) => Promise<{ status: { success: boolean }; community?: CommunityEntity } | null>)(null, { input }, context);
    });

    Then('it should call Community.Community.create with the input name and the user\'s sub', () => {
      expect(context.applicationServices.Community.Community.create).toHaveBeenCalledWith({
        name: input.name,
        endUserExternalId: 'default-user-sub',
      });
    });

    And('it should return a CommunityMutationResult with success true and the created community', () => {
      expect(result).toEqual({
        status: { success: true },
        community: mockCreatedCommunity,
      });
    });
  });

  Scenario('Unauthorized access to currentCommunity', ({ Given, When, Then }) => {
    Given('a user without a communityId in their context', () => {
      if (context.applicationServices.verifiedUser?.hints) {
        context.applicationServices.verifiedUser.hints.communityId = undefined;
      }
    });

    When('the currentCommunity query is executed', async () => {
      await expect((communityResolvers.Query?.currentCommunity as unknown as (parent: unknown, args: Record<string, never>, context: GraphContext, info: unknown) => Promise<CommunityEntity | null>)(null, {}, context, {})).rejects.toThrow('Unauthorized');
    });

    Then('it should throw an "Unauthorized" error', () => {
      // Already checked in When
    });
  });

  Scenario('Unauthorized access to communitiesForCurrentEndUser', ({ Given, When, Then }) => {
    Given('a user without a verifiedJwt in their context', () => {
      if (context.applicationServices.verifiedUser) {
        context.applicationServices.verifiedUser.verifiedJwt = undefined;
      }
    });

    When('the communitiesForCurrentEndUser query is executed', async () => {
      await expect((communityResolvers.Query?.communitiesForCurrentEndUser as unknown as (parent: unknown, args: Record<string, never>, context: GraphContext, info: unknown) => Promise<CommunityEntity[]>)(null, {}, context, {})).rejects.toThrow('Unauthorized');
    });

    Then('it should throw an "Unauthorized" error', () => {
      // Already checked in When
    });
  });

  Scenario('Unauthorized community creation', ({ Given, When, Then }) => {
    Given('a user without a verifiedJwt in their context', () => {
      if (context.applicationServices.verifiedUser) {
        context.applicationServices.verifiedUser.verifiedJwt = undefined;
      }
    });

    When('the communityCreate mutation is executed', async () => {
      await expect((communityResolvers.Mutation?.communityCreate as unknown as (parent: unknown, args: { input: CommunityCreateInput }, context: GraphContext, info?: unknown) => Promise<{ status: { success: boolean }; community?: CommunityEntity } | null>)(null, { input: { name: 'Test' } }, context)).rejects.toThrow('Unauthorized');
    });

    Then('it should throw an "Unauthorized" error', () => {
      // Already checked in When
    });
  });

  Scenario('Community creation error handling', ({ Given, And, When, Then }) => {
    const input: CommunityCreateInput = { name: 'Failing Community' };
    const errorMessage = 'Creation failed';

    Given('a user with a verifiedUser and a verifiedJwt in their context', () => {
      // Already set up
    });

    And('Community.Community.create throws an error', () => {
      vi.mocked(context.applicationServices.Community.Community.create).mockRejectedValue(new Error(errorMessage));
    });

    When('the communityCreate mutation is executed', async () => {
      result = await (communityResolvers.Mutation?.communityCreate as unknown as (parent: unknown, args: { input: CommunityCreateInput }, context: GraphContext, info?: unknown) => Promise<{ status: { success: boolean; errorMessage?: string } } | null>)(null, { input }, context);
    });

    Then('it should return a CommunityMutationResult with success false and the error message', () => {
      expect(result).toEqual({
        status: { success: false, errorMessage },
      });
    });
  });
});