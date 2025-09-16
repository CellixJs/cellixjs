import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { SystemPassport } from './system.passport.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/system.passport.feature'),
);

describeFeature(feature, ({ given, when, then, and }) => {
  let passport: SystemPassport;
  let permissions: any;
  let communityPassport: any;
  let servicePassport: any;
  let userPassport: any;

  given('I have a permissions object with canManageMembers true', () => {
    permissions = {
      canManageMembers: true
    };
  });

  given('I create a SystemPassport with permissions', () => {
    passport = new SystemPassport(permissions);
  });

  given('I create a SystemPassport with no permissions', () => {
    passport = new SystemPassport();
  });

  when('I access the community property', () => {
    communityPassport = passport.community;
  });

  when('I access the service property', () => {
    servicePassport = passport.service;
  });

  when('I access the user property', () => {
    userPassport = passport.user;
  });

  when('I access the community, service, and user properties', () => {
    communityPassport = passport.community;
    servicePassport = passport.service;
    userPassport = passport.user;
  });

  then('it should return a SystemCommunityPassport instance', () => {
    expect(communityPassport).toBeDefined();
    expect(communityPassport.constructor.name).toBe('SystemCommunityPassport');
  });

  then('it should return a SystemServicePassport instance', () => {
    expect(servicePassport).toBeDefined();
    expect(servicePassport.constructor.name).toBe('SystemServicePassport');
  });

  then('it should return a SystemUserPassport instance', () => {
    expect(userPassport).toBeDefined();
    expect(userPassport.constructor.name).toBe('SystemUserPassport');
  });

  and('accessing community property again should return the same instance', () => {
    const secondAccess = passport.community;
    expect(secondAccess).toBe(communityPassport);
  });

  and('accessing service property again should return the same instance', () => {
    const secondAccess = passport.service;
    expect(secondAccess).toBe(servicePassport);
  });

  and('accessing user property again should return the same instance', () => {
    const secondAccess = passport.user;
    expect(secondAccess).toBe(userPassport);
  });

  and('all passport instances should be created successfully', () => {
    expect(communityPassport).toBeDefined();
    expect(servicePassport).toBeDefined();
    expect(userPassport).toBeDefined();
  });
});