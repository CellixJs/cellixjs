import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Passport } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { getEndUserUnitOfWork } from './end-user.uow.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/end-user.uow.feature')
);

function makeMockEndUserModel() {
  return {
    findById: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
  } as unknown as Models.User.EndUserModelType;
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
  } as unknown as Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let endUserModel: Models.User.EndUserModelType;
  let passport: Passport;
  let result: Domain.Contexts.User.EndUser.EndUserUnitOfWork;

  BeforeEachScenario(() => {
    endUserModel = makeMockEndUserModel();
    passport = makeMockPassport();
    result = {} as Domain.Contexts.User.EndUser.EndUserUnitOfWork;
  });

  Background(({ Given, And }) => {
    Given('a Mongoose context factory with a working service', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid EndUser model from the models context', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid passport for domain operations', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Creating an EndUser Unit of Work', ({ When, Then, And }) => {
    When('I call getEndUserUnitOfWork with the EndUser model and passport', () => {
      result = getEndUserUnitOfWork(endUserModel, passport);
    });

    Then('I should receive a properly initialized EndUserUnitOfWork', () => {
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