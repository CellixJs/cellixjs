import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { CommunityEntityReference } from '../../contexts/community/community/community.ts';
import type { EndUserEntityReference } from '../../contexts/user/end-user/end-user.ts'
import type { MemberEntityReference } from '../../contexts/community/member/member.ts';
import type { ServiceEntityReference } from '../../contexts/service/service/service.ts';
import type { StaffRoleEntityReference } from '../../contexts/user/staff-role/staff-role.ts';
import type { StaffUserEntityReference } from '../../contexts/user/staff-user/staff-user.ts';
import type { VendorUserEntityReference } from '../../contexts/user/vendor-user/vendor-user.ts';
import { MemberCommunityPassport } from './contexts/member.community.passport.ts';
import { MemberCommunityVisa } from './contexts/member.community.visa.ts';
import { MemberPassport } from './member.passport.ts';
import { MemberServicePassport } from './contexts/member.service.passport.ts';
import { MemberServiceVisa } from './contexts/member.service.visa.ts';
import { MemberUserEndUserVisa } from './contexts/member.user.end-user.visa.ts';
import { MemberUserStaffRoleVisa } from './contexts/member.user.staff-role.visa.ts';
import { MemberUserStaffUserVisa } from './contexts/member.user.staff-user.visa.ts';
import { MemberUserVendorUserVisa } from './contexts/member.user.vendor-user.visa.ts';
import { MemberUserPassport } from './contexts/member.user.passport.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/member.passport.feature'),
);

// Helper factories for entity references
function makeUser(id = 'user-1') {
  return { id } as EndUserEntityReference;
}

function makeCommunity(id = 'community-1') {
  return { id, name: 'Test Community' } as CommunityEntityReference;
}

function makeMember(userId = 'user-1', communityId = 'community-1', accountsOverride?: unknown[]) {
  return {
    id: 'member-1',
    community: makeCommunity(communityId),
    accounts: accountsOverride ?? [
      { id: 'account-1', user: makeUser(userId) }
    ],
  } as unknown as MemberEntityReference;
}

describeFeature(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let user: EndUserEntityReference;
  let member: MemberEntityReference;
  let community: CommunityEntityReference;
  let passport: MemberPassport;

  BeforeEachScenario(() => {
    user = makeUser();
    member = makeMember();
    community = makeCommunity();
    passport = undefined as unknown as MemberPassport;
  });

  Background(({ Given, And }) => {
    Given('a valid EndUserEntityReference', () => {
      user = makeUser();
    });
    And('a valid MemberEntityReference with at least one account for the user and a matching community', () => {
      member = makeMember(user.id, 'community-1');
    });
    And('a valid CommunityEntityReference', () => {
      community = makeCommunity('community-1');
    });
  });

  Scenario('Creating a MemberPassport with valid user, member, and community', ({ When, Then }) => {
    When('I create a MemberPassport with the user, member, and community', () => {
      passport = new MemberPassport(user, member, community);
    });
    Then('the passport should be created successfully', () => {
      expect(passport).toBeInstanceOf(MemberPassport);
    });
  });

  Scenario('Creating a MemberPassport with a user who is not a member', ({ Given, When, Then }) => {
    let createPassport: () => void;
    Given('a MemberEntityReference with no account for the user', () => {
      member = makeMember('other-user', 'community-1', []);
    });
    When('I try to create a MemberPassport with the user, member, and community', () => {
      createPassport = () => {
        passport = new MemberPassport(user, member, community);
      };
    });
    Then('an error should be thrown indicating the user is not a member of the community', () => {
      expect(createPassport).toThrow(
        `User ${user.id} is not a member of the community ${member.community.id}`
      );
    });
  });

  Scenario('Creating a MemberPassport with a member whose community does not match', ({ Given, When, Then }) => {
    let createPassport: () => void;
    Given('a MemberEntityReference whose community does not match the provided CommunityEntityReference', () => {
      member = makeMember(user.id, 'community-2');
      community = makeCommunity('community-1');
    });
    When('I try to create a MemberPassport with the user, member, and community', () => {
      createPassport = () => {
        passport = new MemberPassport(user, member, community);
      };
    });
    Then('an error should be thrown indicating the member is not part of the community', () => {
      expect(createPassport).toThrow(
        `Member ${member.id} is not part of the community ${community.id}`
      );
    });
  });

  Scenario('Accessing the community passport', ({ When, And, Then }) => {
    let communityPassport: unknown;
    When('I create a MemberPassport with valid user, member, and community', () => {
      passport = new MemberPassport(user, member, community);
    });
    And('I access the community property', () => {
      communityPassport = passport.community;
    });
    Then('I should receive a MemberCommunityPassport instance with all visas', () => {
      expect(communityPassport).toBeInstanceOf(MemberCommunityPassport);
      expect((communityPassport as MemberCommunityPassport).forCommunity(community)).toBeInstanceOf(MemberCommunityVisa);
    });
  });

  Scenario('Accessing the service passport', ({ When, And, Then }) => {
    let servicePassport: unknown;
    When('I create a MemberPassport with valid user, member, and community', () => {
      passport = new MemberPassport(user, member, community);
    });
    And('I access the service property', () => {
      servicePassport = passport.service;
    });
    Then('I should receive a MemberServicePassport instance with all visas', () => {
      expect(servicePassport).toBeInstanceOf(MemberServicePassport);
      expect((servicePassport as MemberServicePassport).forService({} as ServiceEntityReference)).toBeInstanceOf(MemberServiceVisa);
    });
  });

  Scenario('Accessing the user passport', ({ When, And, Then }) => {
    let userPassport: unknown;
    When('I create a MemberPassport with valid user, member, and community', () => {
      passport = new MemberPassport(user, member, community);
    });
    And('I access the user property', () => {
      userPassport = passport.user;
    });
    Then('I should receive a MemberUserPassport instance with all visas', () => {
      expect(userPassport).toBeInstanceOf(MemberUserPassport);
      expect((userPassport as MemberUserPassport).forStaffUser({} as StaffUserEntityReference)).toBeInstanceOf(MemberUserStaffUserVisa);
      expect((userPassport as MemberUserPassport).forStaffRole({} as StaffRoleEntityReference)).toBeInstanceOf(MemberUserStaffRoleVisa);
      expect((userPassport as MemberUserPassport).forEndUser(user)).toBeInstanceOf(MemberUserEndUserVisa);
      expect((userPassport as MemberUserPassport).forVendorUser({} as VendorUserEntityReference)).toBeInstanceOf(MemberUserVendorUserVisa);
    });
  });
});
