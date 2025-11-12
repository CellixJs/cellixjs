import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Passport } from '@ocom/domain';
import { VendorUserRolePersistence } from './index.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/index.feature')
);

function makeMockModelsContext() {
  return {
    Role: {
      VendorUserRole: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
        updateOne: vi.fn(),
        deleteOne: vi.fn(),
      } as unknown as Models.Role.VendorUserRoleModelType,
    },
  } as unknown as Parameters<typeof VendorUserRolePersistence>[0];
}

function makeMockPassport() {
  return {
    community: {
      forCommunity: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
    user: {
      forVendorUser: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let models: Parameters<typeof VendorUserRolePersistence>[0];
  let passport: Passport;
  let result: ReturnType<typeof VendorUserRolePersistence>;

  BeforeEachScenario(() => {
    models = makeMockModelsContext();
    passport = makeMockPassport();
    result = {} as ReturnType<typeof VendorUserRolePersistence>;
  });

  Background(({ Given, And }) => {
    Given('a valid models context with VendorUserRole model', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid passport for domain operations', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Creating VendorUserRole Persistence', ({ When, Then, And }) => {
    When('I call VendorUserRolePersistence with models and passport', () => {
      result = VendorUserRolePersistence(models, passport);
    });

    Then('I should receive an object with VendorUserRoleUnitOfWork property', () => {
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('VendorUserRoleUnitOfWork');
    });

    And('the VendorUserRoleUnitOfWork should be properly initialized', () => {
      expect(result.VendorUserRoleUnitOfWork).toBeDefined();
      expect(typeof result.VendorUserRoleUnitOfWork).toBe('object');
      expect(result.VendorUserRoleUnitOfWork).toHaveProperty('withTransaction');
      expect(result.VendorUserRoleUnitOfWork).toHaveProperty('withScopedTransaction');
      expect(result.VendorUserRoleUnitOfWork).toHaveProperty('withScopedTransactionById');
    });
  });
});