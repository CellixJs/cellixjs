import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Passport } from '@ocom/domain';
import { EndUserRolePersistence } from './index.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/index.feature')
);

function makeMockModelsContext() {
  return {
    Role: {
      EndUserRole: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
        updateOne: vi.fn(),
        deleteOne: vi.fn(),
      } as unknown as Models.Role.EndUserRoleModelType,
    },
  } as unknown as Parameters<typeof EndUserRolePersistence>[0];
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
  let models: Parameters<typeof EndUserRolePersistence>[0];
  let passport: Passport;
  let result: ReturnType<typeof EndUserRolePersistence>;

  BeforeEachScenario(() => {
    models = makeMockModelsContext();
    passport = makeMockPassport();
    result = {} as ReturnType<typeof EndUserRolePersistence>;
  });

  Background(({ Given, And }) => {
    Given('a valid models context with EndUserRole model', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid passport for domain operations', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Creating EndUserRole Persistence', ({ When, Then, And }) => {
    When('I call EndUserRolePersistence with models and passport', () => {
      result = EndUserRolePersistence(models, passport);
    });

    Then('I should receive an object with EndUserRoleUnitOfWork property', () => {
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('EndUserRoleUnitOfWork');
    });

    And('the EndUserRoleUnitOfWork should be properly initialized', () => {
      expect(result.EndUserRoleUnitOfWork).toBeDefined();
      expect(typeof result.EndUserRoleUnitOfWork).toBe('object');
      expect(result.EndUserRoleUnitOfWork).toHaveProperty('withTransaction');
      expect(result.EndUserRoleUnitOfWork).toHaveProperty('withScopedTransaction');
      expect(result.EndUserRoleUnitOfWork).toHaveProperty('withScopedTransactionById');
    });
  });
});