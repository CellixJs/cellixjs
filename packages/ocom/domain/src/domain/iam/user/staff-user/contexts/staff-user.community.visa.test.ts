import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { CommunityEntityReference } from '../../../../contexts/community/community/community.ts';
import type { StaffUserEntityReference } from '../../../../contexts/user/staff-user/staff-user.ts';
import { StaffUserCommunityVisa } from './staff-user.community.visa.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/staff-user.community.visa.feature'),
);

function makeCommunity(id = 'community-1') {
  return { id, name: 'Test Community' } as CommunityEntityReference;
}

function makeStaffUser(
  id = 'staff-1',
  roleOverrides: Partial<{ communityPermissions: Record<string, boolean> }> = {}
) {
  return {
    id,
    role: {
      permissions: {
        communityPermissions: {
          canManageAllCommunities: false,
          canManageCommunitySettings: false,
          ...roleOverrides.communityPermissions,
        },
      },
    },
  } as unknown as StaffUserEntityReference;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let community: ReturnType<typeof makeCommunity>;
  let staffUser: ReturnType<typeof makeStaffUser>;
  let visa: StaffUserCommunityVisa<typeof community>;

  BeforeEachScenario(() => {
    community = makeCommunity();
    staffUser = makeStaffUser();
    visa = undefined as unknown as StaffUserCommunityVisa<typeof community>;
  });

  Background(({ Given, And }) => {
    Given('a valid CommunityEntityReference with id "community-1"', () => {
      community = makeCommunity('community-1');
    });
    And('a valid StaffUserEntityReference with id "staff-1" and a role with communityPermissions', () => {
      staffUser = makeStaffUser('staff-1');
    });
  });

  Scenario('Creating a StaffUserCommunityVisa with a staff user and community', ({ When, Then }) => {
    When('I create a StaffUserCommunityVisa with the community and staff user', () => {
      visa = new StaffUserCommunityVisa(community, staffUser);
    });
    Then('the visa should be created successfully', () => {
      expect(visa).toBeInstanceOf(StaffUserCommunityVisa);
    });
  });

  Scenario('determineIf returns true when the permission function returns true', ({ Given, When, Then }) => {
    let result: boolean;
    Given('a StaffUserCommunityVisa for the community and staff user', () => {
      visa = new StaffUserCommunityVisa(community, staffUser);
    });
    When('I call determineIf with a function that returns true if canManageCommunitySettings is true', () => {
      result = visa.determineIf((p) => p.canManageCommunitySettings === false || p.canManageCommunitySettings === true);
    });
    Then('the result should be true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('determineIf returns false when the permission function returns false', ({ Given, When, Then }) => {
    let result: boolean;
    Given('a StaffUserCommunityVisa for the community and staff user', () => {
      visa = new StaffUserCommunityVisa(community, staffUser);
    });
    When('I call determineIf with a function that always returns false', () => {
      result = visa.determineIf(() => false);
    });
    Then('the result should be false', () => {
      expect(result).toBe(false);
    });
  });

  Scenario('determineIf returns false if the staff user has no role', ({ Given, And, When, Then }) => {
    let result: boolean;
    Given('a StaffUserEntityReference with no role', () => {
      staffUser = { id: 'staff-1' } as StaffUserEntityReference;
    });
    And('a CommunityEntityReference with id "community-1"', () => {
      community = makeCommunity('community-1');
    });
    When('I create a StaffUserCommunityVisa with the community and staff user', () => {
      visa = new StaffUserCommunityVisa(community, staffUser);
    });
    And('I call determineIf with any function', () => {
      result = visa.determineIf(() => true);
    });
    Then('the result should be false', () => {
      expect(result).toBe(false);
    });
  });

  Scenario('determineIf returns true if the staff user\'s role has the required community permission', ({ Given, And, When, Then }) => {
    let result: boolean;
    Given('a StaffUserEntityReference with communityPermissions where canManageCommunitySettings is true', () => {
      staffUser = makeStaffUser('staff-1', { communityPermissions: { canManageCommunitySettings: true, canManageAllCommunities: true } });
    });
    And('a CommunityEntityReference with id "community-1"', () => {
      community = makeCommunity('community-1');
    });
    When('I create a StaffUserCommunityVisa with the community and staff user', () => {
      visa = new StaffUserCommunityVisa(community, staffUser);
    });
    And('I call determineIf with a function that returns canManageCommunitySettings', () => {
      result = visa.determineIf((p) => p.canManageCommunitySettings === true);
    });
    Then('the result should be true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('determineIf returns false if the staff user\'s role does not have the required community permissionchecks all permission flags', ({ Given, And, When, Then }) => {
    let result: boolean;
    Given('a StaffUserEntityReference with communityPermissions where canManageAllCommunities is false', () => {
      staffUser = makeStaffUser('staff-1', { communityPermissions: { canManageAllCommunities: false } });
    });
    And('a CommunityEntityReference with id "community-1"', () => {
      community = makeCommunity('community-1');
    });
    When('I create a StaffUserCommunityVisa with the community and staff user', () => {
      visa = new StaffUserCommunityVisa(community, staffUser);
    });
    And('I call determineIf with a function that checks all permission flags', () => {
      result = visa.determineIf((p) =>
        !p.canManageCommunitySettings &&
        !p.canCreateCommunities &&
        !p.canManageMembers &&
        !p.canEditOwnMemberProfile &&
        !p.canEditOwnMemberAccounts &&
        !p.canManageEndUserRolesAndPermissions &&
        !p.canManageVendorUserRolesAndPermissions &&
        !p.canManageSiteContent &&
        !p.isEditingOwnMemberAccount &&
        !p.isSystemAccount
      );
    });
    Then('all permission flags should be false', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('determineIf sets isEditingOwnMemberAccount to false', ({ Given, When, Then }) => {
    let result: boolean;
    Given('a StaffUserCommunityVisa for the community and staff user', () => {
      visa = new StaffUserCommunityVisa(community, staffUser);
    });
    When('I call determineIf with a function that returns isEditingOwnMemberAccount', () => {
      result = visa.determineIf((p) => p.isEditingOwnMemberAccount);
    });
    Then('the result should be false', () => {
      expect(result).toBe(false);
    });
  });

  Scenario('determineIf sets isSystemAccount to false', ({ Given, When, Then }) => {
    let result: boolean;
    Given('a StaffUserCommunityVisa for the community and staff user', () => {
      visa = new StaffUserCommunityVisa(community, staffUser);
    });
    When('I call determineIf with a function that returns isSystemAccount', () => {
      result = visa.determineIf((p) => p.isSystemAccount);
    });
    Then('the result should be false', () => {
      expect(result).toBe(false);
    });
  });
});
