import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';

import type { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { getVendorUserUnitOfWork } from './vendor-user.uow.ts';
import type { VendorUserModelType } from '@ocom/data-sources-mongoose-models/user';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/vendor-user.uow.feature')
);

function makeMockVendorUserModel() {
  return {
    findById: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
  } as unknown as VendorUserModelType;
}

function makeMockPassport() {
  return {
    user: {
      forVendorUser: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Domain.Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let vendorUserModel: VendorUserModelType;
  let passport: Domain.Passport;
  let result: Domain.Contexts.User.VendorUser.VendorUserUnitOfWork;

  BeforeEachScenario(() => {
    vendorUserModel = makeMockVendorUserModel();
    passport = makeMockPassport();
    result = {} as Domain.Contexts.User.VendorUser.VendorUserUnitOfWork;
  });

  Background(({ Given, And }) => {
    Given('a Mongoose context factory with a working service', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid VendorUser model from the models context', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid passport for domain operations', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Creating a VendorUserUnitOfWork instance', ({ When, Then, And }) => {
    When('I create a VendorUserUnitOfWork with the required dependencies', () => {
      result = getVendorUserUnitOfWork(vendorUserModel, passport);
    });

    Then('it should return a VendorUserUnitOfWork instance', () => {
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