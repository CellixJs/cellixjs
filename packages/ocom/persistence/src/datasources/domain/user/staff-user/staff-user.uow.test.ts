import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Passport } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { getStaffUserUnitOfWork } from './staff-user.uow.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/staff-user.uow.feature')
);

function makeStaffUserModel() {
  return {} as Models.User.StaffUserModelType;
}

function makeMockPassport() {
  return {
    community: {
      forCommunity: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
    case: {
      forServiceTicketV1: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Passport;
}

test.for(feature, ({ Scenario }) => {
  Scenario('Creating a staff user unit of work', ({ Given, When, Then, And }) => {
    let model: Models.User.StaffUserModelType;
    let passport: Passport;
    let result: StaffUserUnitOfWork;

    Given('a valid StaffUser model and passport', () => {
      model = makeStaffUserModel();
      passport = makeMockPassport();
    });
    When('I call getStaffUserUnitOfWork with the model and passport', () => {
      result = getStaffUserUnitOfWork(model, passport);
    });

    Then('I should receive a properly initialized StaffUserUnitOfWork', () => {
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