import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';

import type { Domain } from '@ocom/domain';
import { ReadonlyDataSourceImplementation } from './index.ts';
import type { CommunityModelType } from '@ocom/data-sources-mongoose-models/community';
import type { MemberModelType } from '@ocom/data-sources-mongoose-models/member';
import type { EndUserModelType } from '@ocom/data-sources-mongoose-models/user/end-user';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'index.feature')
);

function makeMockModelsContext() {
  return {
    Community: {
      Community: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
        aggregate: vi.fn(),
      } as unknown as CommunityModelType,
    },
    Member: {
      Member: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
      } as unknown as MemberModelType,
    },
    User: {
      EndUser: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
        aggregate: vi.fn(),
      } as unknown as EndUserModelType,
    },
  } as unknown as Parameters<typeof ReadonlyDataSourceImplementation>[0];
}

function makeMockPassport() {
  return {
    community: {
      forCommunity: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
    user: {
      forEndUser: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Domain.Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let models: Parameters<typeof ReadonlyDataSourceImplementation>[0];
  let passport: Domain.Passport;
  let result: ReturnType<typeof ReadonlyDataSourceImplementation>;

  BeforeEachScenario(() => {
    models = makeMockModelsContext();
    passport = makeMockPassport();
    result = {} as ReturnType<typeof ReadonlyDataSourceImplementation>;
  });

  Background(({ Given, And }) => {
    Given('a valid models context with all readonly models', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid passport for domain operations', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Creating Readonly Data Source Implementation', ({ When, Then, And }) => {
    When('I call ReadonlyDataSourceImplementation with models and passport', () => {
      result = ReadonlyDataSourceImplementation(models, passport);
    });

    Then('I should receive a ReadonlyDataSource object', () => {
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    And('the ReadonlyDataSource should have Community property', () => {
      expect(result).toHaveProperty('Community');
      expect(typeof result.Community).toBe('object');
    });

    And('the ReadonlyDataSource should have User property', () => {
      expect(result).toHaveProperty('User');
      expect(typeof result.User).toBe('object');
    });

    And('the Community property should have the correct structure', () => {
      expect(result.Community).toHaveProperty('Community');
      expect(result.Community).toHaveProperty('Member');
      expect(result.Community.Community).toHaveProperty('CommunityReadRepo');
      expect(result.Community.Member).toHaveProperty('MemberReadRepo');
    });

    And('the User property should have the correct structure', () => {
      expect(result.User).toHaveProperty('EndUser');
      expect(result.User.EndUser).toHaveProperty('EndUserReadRepo');
    });
  });
});