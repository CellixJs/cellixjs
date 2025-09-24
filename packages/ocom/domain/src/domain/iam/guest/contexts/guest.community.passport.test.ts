import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { GuestCommunityPassport } from './guest.community.passport.ts';
import type { CommunityEntityReference } from '../../../contexts/community/community/community.ts';
import type { CommunityVisa } from '../../../contexts/community/community.visa.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/guest.community.passport.feature'),
);

test.for(feature, ({ Scenario }) => {
  let passport: GuestCommunityPassport;
  let communityRef: CommunityEntityReference;
  let visa: CommunityVisa;
  let permissionResult: boolean;

  Scenario('Creating GuestCommunityPassport and getting visa for community', ({ When, Then, And }) => {
    When('I create a GuestCommunityPassport', () => {
      passport = new GuestCommunityPassport();
    });

    And('I have a community entity reference', () => {
      communityRef = { id: 'community-123' } as CommunityEntityReference;
    });

    And('I call forCommunity with the community reference', () => {
      visa = passport.forCommunity(communityRef);
    });

    Then('it should return a CommunityVisa', () => {
      expect(visa).toBeDefined();
      expect(typeof visa.determineIf).toBe('function');
    });

    And('the visa should deny all permissions', () => {
      expect(visa.determineIf(() => true)).toBe(false);
    });
  });

  Scenario('Using visa to determine permissions', ({ When, Then, And }) => {
    When('I create a GuestCommunityPassport', () => {
      passport = new GuestCommunityPassport();
    });

    And('I have a community entity reference', () => {
      communityRef = { id: 'community-123' } as CommunityEntityReference;
    });

    And('I get a visa for the community', () => {
      visa = passport.forCommunity(communityRef);
    });

    And('I use determineIf to check any permission', () => {
      permissionResult = visa.determineIf(() => true);
    });

    Then('it should return false', () => {
      expect(permissionResult).toBe(false);
    });
  });
});