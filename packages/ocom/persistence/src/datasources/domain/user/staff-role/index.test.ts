import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';

import type { Passport } from '@ocom/domain';
import { StaffRolePersistence } from './index.ts';
import type { StaffRoleModelType } from '@ocom/data-sources-mongoose-models/role/staff-role';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/index.feature')
);

function makeMockModelsContext() {
  return {
    StaffRole: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
        updateOne: vi.fn(),
        deleteOne: vi.fn(),
        findByIdAndDelete: vi.fn(),
        findOne: vi.fn(),
      } as unknown as StaffRoleModelType,
  } as unknown as Parameters<typeof StaffRolePersistence>[0];
}

function makeMockModelsContextWithoutStaffRole() {
  return {
    Role: {
      // StaffRole is intentionally missing
    },
  } as unknown as Parameters<typeof StaffRolePersistence>[0];
}

function makeMockPassport() {
  return {
    user: {
      forStaffRole: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let models: Parameters<typeof StaffRolePersistence>[0];
  let passport: Passport;
  let result: ReturnType<typeof StaffRolePersistence>;

  BeforeEachScenario(() => {
    models = makeMockModelsContext();
    passport = makeMockPassport();
    result = {} as ReturnType<typeof StaffRolePersistence>;
  });

  Background(({ Given, And }) => {
    Given('a valid models context with StaffRole model', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid passport for domain operations', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Creating StaffRole Persistence', ({ When, Then, And }) => {
    When('I call StaffRolePersistence with models and passport', () => {
      result = StaffRolePersistence(models, passport);
    });

    Then('I should receive an object with StaffRoleUnitOfWork property', () => {
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('StaffRoleUnitOfWork');
    });

    And('the StaffRoleUnitOfWork should be properly initialized', () => {
      expect(result.StaffRoleUnitOfWork).toBeDefined();
      expect(typeof result.StaffRoleUnitOfWork).toBe('object');
      expect(result.StaffRoleUnitOfWork).toHaveProperty('withTransaction');
      expect(result.StaffRoleUnitOfWork).toHaveProperty('withScopedTransaction');
      expect(result.StaffRoleUnitOfWork).toHaveProperty('withScopedTransactionById');
    });
  });

  Scenario('Creating StaffRole Persistence with missing StaffRole model', ({ Given, When, Then }) => {
    let caughtError: Error;

    Given('a models context without StaffRole model', () => {
      models = makeMockModelsContextWithoutStaffRole();
    });

    When('I call StaffRolePersistence with models and passport', () => {
      try {
        result = StaffRolePersistence(models, passport);
      } catch (error) {
        caughtError = error as Error;
      }
    });

    Then('an error should be thrown indicating "StaffRole model is not available in the mongoose context"', () => {
      expect(caughtError).toBeDefined();
      expect(caughtError.message).toContain('StaffRole model is not available in the mongoose context');
    });
  });
});