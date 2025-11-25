import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';

import type { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { getServiceTicketV1UnitOfWork } from './service-ticket-v1.uow.ts';
import type { ServiceTicketModelType } from '@ocom/data-sources-mongoose-models/case';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/service-ticket-v1.uow.feature')
);

function makeMockServiceTicketModel() {
  return {
    findById: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
  } as unknown as ServiceTicketModelType;
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
  let serviceTicketModel: ServiceTicketModelType;
  let passport: Domain.Passport;
  let result: Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1UnitOfWork;

  BeforeEachScenario(() => {
    serviceTicketModel = makeMockServiceTicketModel();
    passport = makeMockPassport();
    result = {} as Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1UnitOfWork;
  });

  Background(({ Given, And }) => {
    Given('a Mongoose context factory with a working service', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid ServiceTicket model from the models context', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid passport for domain operations', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Creating a ServiceTicketV1 Unit of Work', ({ When, Then, And }) => {
    When('I call getServiceTicketV1UnitOfWork with the ServiceTicket model and passport', () => {
      result = getServiceTicketV1UnitOfWork(serviceTicketModel, passport);
    });

    Then('I should receive a properly initialized ServiceTicketV1UnitOfWork', () => {
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