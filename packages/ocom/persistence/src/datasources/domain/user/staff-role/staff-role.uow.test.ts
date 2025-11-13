import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Passport } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { getStaffRoleUnitOfWork } from './staff-role.uow.ts';

import { StaffRole } from '@ocom/domain/contexts/user/staff-role';
const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/staff-role.uow.feature')
);

function makeMockStaffRoleModel() {
  return {
    findById: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
  } as unknown as Models.Role.StaffRoleModelType;
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
  let staffRoleModel: Models.Role.StaffRoleModelType;
  let passport: Passport;
  let result: StaffRoleUnitOfWork;

  BeforeEachScenario(() => {
    staffRoleModel = makeMockStaffRoleModel();
    passport = makeMockPassport();
    result = {} as StaffRoleUnitOfWork;
  });

  Background(({ Given, And }) => {
    Given('a Mongoose context factory with a working service', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid StaffRole model from the models context', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid passport for domain operations', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Creating a StaffRole Unit of Work', ({ When, Then, And }) => {
    When('I call getStaffRoleUnitOfWork with the StaffRole model and passport', () => {
      result = getStaffRoleUnitOfWork(staffRoleModel, passport);
    });

    Then('I should receive a properly initialized StaffRoleUnitOfWork', () => {
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    And('the Unit of Work should have the correct repository type', () => {
      // The Unit of Work should have transaction methods
      expect(result).toHaveProperty('withTransaction');
      expect(typeof result.withTransaction).toBe('function');
    });

    And('the Unit of Work should have the correct converter type', () => {
      // The Unit of Work should have scoped transaction methods
      expect(result).toHaveProperty('withScopedTransaction');
      expect(typeof result.withScopedTransaction).toBe('function');
    });

    And('the Unit of Work should have the correct event buses', () => {
      // The Unit of Work should have scoped transaction by id method
      expect(result).toHaveProperty('withScopedTransactionById');
      expect(typeof result.withScopedTransactionById).toBe('function');
    });
  });
});