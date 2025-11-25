import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';

import type { Passport } from '@ocom/domain';
import { StaffUserPersistence } from './index.ts';
import type { StaffUserModelType } from '@ocom/data-sources-mongoose-models/user/staff-user';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/index.feature')
);

function makeMockModelsContext() {
  return {
    StaffUser: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
        updateOne: vi.fn(),
        deleteOne: vi.fn(),
        findByIdAndDelete: vi.fn(),
        findOne: vi.fn(),
      } as unknown as StaffUserModelType,
  } as unknown as Parameters<typeof StaffUserPersistence>[0];
}

function makeMockModelsContextWithoutStaffUser() {
  return {
    User: {
      // StaffUser is intentionally missing
    },
  } as unknown as Parameters<typeof StaffUserPersistence>[0];
}

function makeMockPassport() {
  return {
    user: {
      forStaffUser: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let models: Parameters<typeof StaffUserPersistence>[0];
  let passport: Passport;
  let result: ReturnType<typeof StaffUserPersistence>;

  BeforeEachScenario(() => {
    models = makeMockModelsContext();
    passport = makeMockPassport();
    result = {} as ReturnType<typeof StaffUserPersistence>;
  });

  Background(({ Given, And }) => {
    Given('a valid models context with StaffUser model', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid passport for domain operations', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Creating StaffUser Persistence', ({ When, Then, And }) => {
    When('I call StaffUserPersistence with models and passport', () => {
      result = StaffUserPersistence(models, passport);
    });

    Then('I should receive an object with StaffUserUnitOfWork property', () => {
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('StaffUserUnitOfWork');
    });

    And('the StaffUserUnitOfWork should be properly initialized', () => {
      expect(result.StaffUserUnitOfWork).toBeDefined();
      expect(typeof result.StaffUserUnitOfWork).toBe('object');
      expect(result.StaffUserUnitOfWork).toHaveProperty('withTransaction');
      expect(result.StaffUserUnitOfWork).toHaveProperty('withScopedTransaction');
      expect(result.StaffUserUnitOfWork).toHaveProperty('withScopedTransactionById');
    });
  });

  Scenario('Creating StaffUser Persistence with missing StaffUser model', ({ Given, When, Then }) => {
    let caughtError: Error;

    Given('a models context without StaffUser model', () => {
      models = makeMockModelsContextWithoutStaffUser();
    });

    When('I call StaffUserPersistence with models and passport', () => {
      try {
        result = StaffUserPersistence(models, passport);
      } catch (error) {
        caughtError = error as Error;
      }
    });

    Then('an error should be thrown indicating "StaffUser model is not available in the mongoose context"', () => {
      expect(caughtError).toBeDefined();
      expect(caughtError.message).toContain('StaffUser model is not available in the mongoose context');
    });
  });
});