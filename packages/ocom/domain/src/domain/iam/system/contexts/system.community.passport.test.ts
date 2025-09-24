import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { SystemCommunityPassport } from './system.community.passport.ts';
import type { CommunityEntityReference } from '../../../contexts/community/community/community.ts';
import type { CommunityDomainPermissions } from '../../../contexts/community/community.domain-permissions.ts';
import type { CommunityVisa } from '../../../contexts/community/community.visa.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/system.community.passport.feature'),
);

test.for(feature, ({ Scenario, Background }) => {
  let passport: SystemCommunityPassport;
  let permissions: Partial<CommunityDomainPermissions>;
  let communityRef: CommunityEntityReference;
  let visa: CommunityVisa;
  let permissionResult: boolean;

  Background(({ Given }) => {
    Given('I have community domain permissions with canManageMembers true', () => {
      permissions = {
        canManageMembers: true
      };
    });
  });

  Scenario('Creating SystemCommunityPassport and getting visa for community', ({ Given, When, Then, And }) => {
    Given('I create a SystemCommunityPassport with permissions', () => {
      passport = new SystemCommunityPassport(permissions);
    });

    And('I have a community entity reference', () => {
      communityRef = { id: 'community-123' } as CommunityEntityReference;
    });

    When('I call forCommunity with the community reference', () => {
      visa = passport.forCommunity(communityRef);
    });

    Then('it should return a CommunityVisa', () => {
      expect(visa).toBeDefined();
      expect(typeof visa.determineIf).toBe('function');
    });

    And('the visa should allow determining permissions', () => {
      expect(typeof visa.determineIf).toBe('function');
      const result = visa.determineIf((perms: Readonly<CommunityDomainPermissions>) => perms.canManageMembers);
      expect(typeof result).toBe('boolean');
    });
  });

  Scenario('Creating SystemCommunityPassport with no permissions', ({ Given, When, Then, And }) => {
    Given('I create a SystemCommunityPassport with no permissions', () => {
      passport = new SystemCommunityPassport();
    });

    And('I have a community entity reference', () => {
      communityRef = { id: 'community-123' } as CommunityEntityReference;
    });

    When('I call forCommunity with the community reference', () => {
      visa = passport.forCommunity(communityRef);
    });

    Then('it should return a CommunityVisa that works with empty permissions', () => {
      expect(visa).toBeDefined();
      expect(typeof visa.determineIf).toBe('function');
    });
  });

  Scenario('Using visa to determine permissions', ({ Given, When, Then, And }) => {
    Given('I create a SystemCommunityPassport with canManageMembers permission', () => {
      passport = new SystemCommunityPassport({ canManageMembers: true });
    });

    And('I have a community entity reference', () => {
      communityRef = { id: 'community-123' } as CommunityEntityReference;
    });

    When('I get a visa for the community', () => {
      visa = passport.forCommunity(communityRef);
    });

    And('I use determineIf to check if canManageMembers is true', () => {
      permissionResult = visa.determineIf((perms: Readonly<CommunityDomainPermissions>) => perms.canManageMembers === true);
    });

    Then('it should return true', () => {
      expect(permissionResult).toBe(true);
    });
  });
});