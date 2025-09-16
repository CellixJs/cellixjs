import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { SystemCommunityPassport } from './system.community.passport.ts';
import type { CommunityEntityReference } from '../../../contexts/community/community/community.ts';
import type { CommunityVisa } from '../../../contexts/community/community.visa.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/system.community.passport.feature'),
);

describeFeature(feature, ({ given, when, then, and }) => {
  let passport: SystemCommunityPassport;
  let permissions: any;
  let communityRef: CommunityEntityReference;
  let visa: CommunityVisa;
  let permissionResult: boolean;

  given('I have community domain permissions with canManageMembers true', () => {
    permissions = {
      canManageMembers: true
    };
  });

  given('I create a SystemCommunityPassport with permissions', () => {
    passport = new SystemCommunityPassport(permissions);
  });

  given('I create a SystemCommunityPassport with no permissions', () => {
    passport = new SystemCommunityPassport();
  });

  given('I create a SystemCommunityPassport with canManageMembers permission', () => {
    permissions = { canManageMembers: true };
    passport = new SystemCommunityPassport(permissions);
  });

  given('I have a community entity reference', () => {
    communityRef = { id: 'community-123' } as CommunityEntityReference;
  });

  when('I call forCommunity with the community reference', () => {
    visa = passport.forCommunity(communityRef);
  });

  when('I get a visa for the community', () => {
    visa = passport.forCommunity(communityRef);
  });

  when('I use determineIf to check if canManageMembers is true', () => {
    permissionResult = visa.determineIf((perms: any) => perms.canManageMembers === true);
  });

  then('it should return a CommunityVisa', () => {
    expect(visa).toBeDefined();
    expect(typeof visa.determineIf).toBe('function');
  });

  then('it should return a CommunityVisa that works with empty permissions', () => {
    expect(visa).toBeDefined();
    expect(typeof visa.determineIf).toBe('function');
  });

  then('it should return true', () => {
    expect(permissionResult).toBe(true);
  });

  and('the visa should allow determining permissions', () => {
    expect(typeof visa.determineIf).toBe('function');
    const result = visa.determineIf((perms: any) => perms.canManageMembers);
    expect(typeof result).toBe('boolean');
  });
});