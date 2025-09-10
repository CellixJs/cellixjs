import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { CommunityEntityReference } from '../../../contexts/community/community/community.ts';
import type { MemberEntityReference } from '../../../contexts/community/member/member.ts';
import { MemberCommunityVisa } from './member.community.visa.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/member.community.visa.feature'),
);

function makeCommunity(id = 'community-1') {
  return { id, name: 'Test Community' } as CommunityEntityReference;
}

function makeMember(
  id = 'member-1',
  communityId = 'community-1',
  roleOverrides: Partial<{ communityPermissions: Record<string, unknown> }> = {}
) {
  return {
    id,
    community: makeCommunity(communityId),
    role: {
      permissions: {
        communityPermissions: {
          canCreateCommunities: true,
          ...roleOverrides.communityPermissions,
        },
      },
    },
  } as unknown as MemberEntityReference;
}

describeFeature(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let community: CommunityEntityReference;
  let member: MemberEntityReference;
  let visa: MemberCommunityVisa<CommunityEntityReference>;

  BeforeEachScenario(() => {
    community = makeCommunity();
    member = makeMember();
    visa = undefined as unknown as MemberCommunityVisa<CommunityEntityReference>;
  });

  Background(({ Given, And }) => {
    Given('a valid CommunityEntityReference with id "community-1"', () => {
      community = makeCommunity('community-1');
    });
    And(
      'a valid MemberEntityReference with id "member-1", community id "community-1", and role with community permissions',
      () => {
        member = makeMember('member-1', 'community-1');
      }
    );
  });

  Scenario(
    'Creating a MemberCommunityVisa with a member belonging to the community',
    ({ When, Then }) => {
      When(
        'I create a MemberCommunityVisa with the community and member',
        () => {
          visa = new MemberCommunityVisa(community, member);
        }
      );
      Then('the visa should be created successfully', () => {
        expect(visa).toBeInstanceOf(MemberCommunityVisa);
      });
    }
  );

  Scenario(
    'determineIf returns true when the permission function returns true',
    ({ Given, When, Then }) => {
        let result: boolean;
      Given('a MemberCommunityVisa for the member and community', () => {
        visa = new MemberCommunityVisa(community, member);
      });
      When(
        'I call determineIf with a function that returns true if canCreateCommunities is true',
        () => {
          result = visa.determineIf((p) => p.canCreateCommunities === true);
        }
      );
      Then('the result should be true', () => {
        expect(result).toBe(true);
      });
    }
  );

  Scenario(
    'determineIf returns false when the permission function returns false',
    ({ Given, When, Then }) => {
      let result: boolean;
      Given('a MemberCommunityVisa for the member and community', () => {
        visa = new MemberCommunityVisa(community, member);
      });
      When('I call determineIf with a function that returns false', () => {
        result = visa.determineIf(() => false);
      });
      Then('the result should be false', () => {
        expect(result).toBe(false);
      });
    }
  );

  Scenario(
    'determineIf returns false if the member does not belong to the community',
    ({ Given, And, When, Then }) => {
      let result: boolean;
      Given('a MemberEntityReference with community id "community-2"', () => {
        member = makeMember('member-1', 'community-2');
      });
      And('a CommunityEntityReference with id "community-1"', () => {
        community = makeCommunity('community-1');
      });
      When(
        'I create a MemberCommunityVisa with the community and member',
        () => {
          visa = new MemberCommunityVisa(community, member);
        }
      );
      And('I call determineIf with any function', () => {
        result = visa.determineIf(() => true);      });
      Then('the result should be false', () => {
        expect(result).toBe(false);
      });
    }
  );

   Scenario(
    'determineIf returns true if the member\'s role has the required permission',
    ({ Given, And, When, Then }) => {
      let result: boolean;
      Given('a MemberEntityReference with communityPermissions where canManageCommunitySettings is true', () => {
        member = makeMember('member-1', 'community-1', {
          communityPermissions: { canManageCommunitySettings: true }
        });
      });
      And('a CommunityEntityReference with id "community-1"', () => {
        community = makeCommunity('community-1');
      });
      When('I create a MemberCommunityVisa with the community and member', () => {
        visa = new MemberCommunityVisa(community, member);
      });
      And('I call determineIf with a function that returns canManageCommunitySettings', () => {
        result = visa.determineIf((p) => p.canManageCommunitySettings === true);
      });
      Then('the result should be true', () => {
        expect(result).toBe(true);
      });
    }
  );

  Scenario(
    'determineIf returns false if the member\'s role does not have the required permission',
    ({ Given, And, When, Then }) => {
      let result: boolean;
      Given('a MemberEntityReference with communityPermissions where canManageCommunitySettings is false', () => {
        member = makeMember('member-1', 'community-1', {
          communityPermissions: { canManageCommunitySettings: false }
        });
      });
      And('a CommunityEntityReference with id "community-1"', () => {
        community = makeCommunity('community-1');
      });
      When('I create a MemberCommunityVisa with the community and member', () => {
        visa = new MemberCommunityVisa(community, member);
      });
      And('I call determineIf with a function that returns canManageCommunitySettings', () => {
        result = visa.determineIf((p) => p.canManageCommunitySettings === true);
      });
      Then('the result should be false', () => {
        expect(result).toBe(false);
      });
    }
  );

  Scenario(
    'determineIf sets isEditingOwnMemberAccount to false',
    ({ Given, When, Then }) => {
      let result: boolean;
      Given('a MemberCommunityVisa for the member and community', () => {
        visa = new MemberCommunityVisa(community, member);
      });
      When(
        'I call determineIf with a function that returns isEditingOwnMemberAccount',
        () => {
          result = visa.determineIf((p) => p.isEditingOwnMemberAccount);
        }
      );
      Then('the result should be false', () => {
        expect(result).toBe(false);
      });
    }
  );

  Scenario(
    'determineIf sets canCreateCommunities to true',
    ({ Given, When, Then }) => {
      let result: boolean;
      Given('a MemberCommunityVisa for the member and community', () => {
        visa = new MemberCommunityVisa(community, member);
      });
      When(
        'I call determineIf with a function that returns canCreateCommunities',
        () => {
          result = visa.determineIf((p) => p.canCreateCommunities === true);
        }
      );
      Then('the result should be true', () => {
        expect(result).toBe(true);
      });
    }
  );

  Scenario(
    'determineIf sets canManageVendorUserRolesAndPermissions to false',
    ({ Given, When, Then }) => {
      let result: boolean;
      Given('a MemberCommunityVisa for the member and community', () => {
        visa = new MemberCommunityVisa(community, member);
      });
      When(
        'I call determineIf with a function that returns canManageVendorUserRolesAndPermissions',
        () => {
          result = visa.determineIf((p) => p.canManageVendorUserRolesAndPermissions);
        }
      );
      Then('the result should be false', () => {
        expect(result).toBe(false);
      });
    }
  );

  Scenario(
    'determineIf sets isSystemAccount to false',
    ({ Given, When, Then }) => {
      let result: boolean;
      Given('a MemberCommunityVisa for the member and community', () => {
        visa = new MemberCommunityVisa(community, member);
      });
      When(
        'I call determineIf with a function that returns isSystemAccount',
        () => {
          result = visa.determineIf((p) => p.isSystemAccount === false);}
      );
      Then('the result should be false', () => {
        expect(result).toBe(true);
      });
    }
  );
});
