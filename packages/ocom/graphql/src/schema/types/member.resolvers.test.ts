import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { GraphContext } from '../../init/context.ts';
import memberResolvers from './member.resolvers.ts';
// Direct imports from domain package
import type { Community, CommunityEntityReference } from '@ocom/domain/contexts/community';
import type { MemberEntityReference } from '@ocom/domain/contexts/member';
import { Community as CommunityClass } from '@ocom/domain/contexts/community';
import { Member as MemberClass } from '@ocom/domain/contexts/member';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/member.resolvers.feature'),
);

type CommunityEntity = { id: string; name: string };
type MemberEntity = { id: string; communityId: string };
type CommunityReference = CommunityEntityReference;
type MemberReference = MemberEntityReference;

function createMockCommunity(overrides: Partial<CommunityEntity> = {}): CommunityEntity {
  return {
    id: 'community-123',
    name: 'Mock Community',
    ...overrides,
  };
}

function createMockMember(overrides: Partial<MemberEntity> = {}): MemberEntity {
  return {
    id: 'member-1',
    communityId: 'community-123',
    ...overrides,
  };
}

function makeMockGraphContext(overrides: Partial<GraphContext> = {}): GraphContext {
  const context: GraphContext = {
    applicationServices: {
      Community: {
        Community: {
          queryById: vi.fn(),
        },
        Member: {
          determineIfAdmin: vi.fn(),
          queryByEndUserExternalId: vi.fn(),
        },
      },
      verifiedUser: {
        verifiedJwt: {
          sub: 'default-user-sub',
        },
      },
      ...overrides.applicationServices,
    },
    ...overrides,
  } as GraphContext;

  return context;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let context: GraphContext;
  let member: MemberEntity;
  let communityResult: unknown;
  let booleanResult: boolean | null;
  let membersResult: unknown;

  BeforeEachScenario(() => {
    context = makeMockGraphContext();
    member = createMockMember();
    communityResult = null;
    booleanResult = null;
    membersResult = null;
    vi.clearAllMocks();
  });

  Scenario('Resolving the community for a member', ({ Given, And, When, Then }) => {
  const resolvedCommunity = createMockCommunity();
  const domainCommunity = resolvedCommunity as unknown as CommunityReference;

    Given('a member with communityId "community-123"', () => {
      member = createMockMember({ communityId: 'community-123' });
    });

    And('the community service can return that community', () => {
      vi
        .mocked(context.applicationServices.Community.queryById)
        .mockResolvedValue(domainCommunity);
    });

    When('the Member.community resolver is executed', async () => {
      communityResult = await (memberResolvers.Member?.community as unknown as (
        parent: MemberEntity,
        args: Record<string, never>,
        graphContext: GraphContext,
        info: unknown,
      ) => Promise<CommunityReference | null>)(member, {}, context, {});
    });

    Then(
      "it should call Community.queryById with the member's communityId",
      () => {
        expect(context.applicationServices.Community.queryById).toHaveBeenCalledWith({
          id: 'community-123',
        });
      },
    );

    And('it should return the resolved community', () => {
      expect(communityResult as CommunityEntity).toEqual(resolvedCommunity);
    });
  });

  Scenario('Checking if a member is an administrator', ({ Given, And, When, Then }) => {
    Given('a member with id "member-1"', () => {
      member = createMockMember({ id: 'member-1' });
    });

    And('the member service indicates the member is an admin', () => {
      vi
        .mocked(context.applicationServices.Community.Member.determineIfAdmin)
        .mockResolvedValue(true);
    });

    When('the Member.isAdmin resolver is executed', async () => {
      booleanResult = await (memberResolvers.Member?.isAdmin as unknown as (
        parent: MemberEntity,
        args: Record<string, never>,
        graphContext: GraphContext,
        info: unknown,
      ) => Promise<boolean>)(member, {}, context, {});
    });

    Then(
      'it should call Community.Member.determineIfAdmin with the member\'s id',
      () => {
        expect(context.applicationServices.Community.Member.determineIfAdmin).toHaveBeenCalledWith({
          memberId: 'member-1',
        });
      },
    );

    And('it should return true', () => {
      expect(booleanResult).toBe(true);
    });
  });

  Scenario('Querying members for the current end user', ({ Given, And, When, Then }) => {
  const resolvedMembers = [createMockMember({ id: 'member-42' })];
  const domainMembers = resolvedMembers as unknown as MemberReference[];

    Given('a signed in user with subject "user-sub-123"', () => {
      if (context.applicationServices.verifiedUser?.verifiedJwt) {
        context.applicationServices.verifiedUser.verifiedJwt.sub = 'user-sub-123';
      }
    });

    And('the member service can return members for that subject', () => {
      vi
        .mocked(context.applicationServices.Community.Member.queryByEndUserExternalId)
        .mockResolvedValue(domainMembers);
    });

    When('the membersForCurrentEndUser query is executed', async () => {
      membersResult = await (memberResolvers.Query?.membersForCurrentEndUser as unknown as (
        parent: unknown,
        args: Record<string, never>,
        graphContext: GraphContext,
        info: unknown,
      ) => Promise<MemberReference[]>)(null, {}, context, {});
    });

    Then(
      'it should call Community.Member.queryByEndUserExternalId with the subject',
      () => {
        expect(context.applicationServices.Community.Member.queryByEndUserExternalId).toHaveBeenCalledWith({
          externalId: 'user-sub-123',
        });
      },
    );

    And('it should return the list of members', () => {
      expect(membersResult as MemberEntity[]).toEqual(resolvedMembers);
    });
  });

  Scenario(
    'Querying members for the current end user without authentication',
    ({ Given, When, Then }) => {
      Given('a user without a verified JWT', () => {
        if (context.applicationServices.verifiedUser) {
          context.applicationServices.verifiedUser.verifiedJwt = undefined;
        }
      });

      When('the membersForCurrentEndUser query is executed', async () => {
        await expect(
          (memberResolvers.Query?.membersForCurrentEndUser as unknown as (
            parent: unknown,
            args: Record<string, never>,
            graphContext: GraphContext,
            info: unknown,
          ) => Promise<MemberReference[]>)(null, {}, context, {}),
        ).rejects.toThrow('Unauthorized');
      });

      Then('it should throw an "Unauthorized" error', () => {
        // Assertion performed in When step
      });
    },
  );
});
