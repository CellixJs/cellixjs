import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { DomainDataSourceImplementation } from './index.ts';

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
      } as unknown as Models.Community.CommunityModelType,
      Member: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
      } as unknown as Models.Member.MemberModelType,
      EndUserRole: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
      } as unknown as Models.Role.EndUserRoleModelType,
    },
    User: {
      EndUser: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
      } as unknown as Models.User.EndUserModelType,
    },
  } as unknown as Parameters<typeof DomainDataSourceImplementation>[0];
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

describeFeature(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let models: Parameters<typeof DomainDataSourceImplementation>[0];
  let passport: Domain.Passport;
  let result: ReturnType<typeof DomainDataSourceImplementation>;

  BeforeEachScenario(() => {
    models = makeMockModelsContext();
    passport = makeMockPassport();
    result = {} as ReturnType<typeof DomainDataSourceImplementation>;
  });

  Background(({ Given, And }) => {
    Given('a valid models context with all domain models', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid passport for domain operations', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Creating Domain Data Source Implementation', ({ When, Then, And }) => {
    When('I call DomainDataSourceImplementation with models and passport', () => {
      result = DomainDataSourceImplementation(models, passport);
    });

    Then('I should receive a DomainDataSource object', () => {
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    And('the DomainDataSource should have Community property', () => {
      expect(result).toHaveProperty('Community');
      expect(typeof result.Community).toBe('object');
    });

    And('the DomainDataSource should have User property', () => {
      expect(result).toHaveProperty('User');
      expect(typeof result.User).toBe('object');
    });

    And('the Community property should have the correct structure', () => {
      expect(result.Community).toHaveProperty('Community');
      expect(result.Community).toHaveProperty('Member');
      expect(result.Community).toHaveProperty('Role');
      expect(result.Community.Role).toHaveProperty('EndUserRole');
    });

    And('the User property should have the correct structure', () => {
      expect(result.User).toHaveProperty('EndUser');
    });
  });
});