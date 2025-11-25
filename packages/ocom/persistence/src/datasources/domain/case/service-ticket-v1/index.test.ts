import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';

import type { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { ServiceTicketV1Persistence } from './index.ts';
import type { ServiceTicketModelType } from '@ocom/data-sources-mongoose-models/case/service-ticket';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/index.feature')
);

function makeMockModelsContext() {
  return {
    Case: {
      ServiceTicket: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
        updateOne: vi.fn(),
        deleteOne: vi.fn(),
      } as unknown as ServiceTicketModelType,
    },
  } as unknown as Parameters<typeof ServiceTicketV1Persistence>[0];
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
  let models: Parameters<typeof ServiceTicketV1Persistence>[0];
  let passport: Domain.Passport;
  let result: ReturnType<typeof ServiceTicketV1Persistence>;

  BeforeEachScenario(() => {
    models = makeMockModelsContext();
    passport = makeMockPassport();
    result = {} as ReturnType<typeof ServiceTicketV1Persistence>;
  });

  Background(({ Given, And }) => {
    Given('a valid models context with ServiceTicket model', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid passport for domain operations', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Creating ServiceTicketV1 Persistence', ({ When, Then, And }) => {
    When('I call ServiceTicketV1Persistence with models and passport', () => {
      result = ServiceTicketV1Persistence(models, passport);
    });

    Then('I should receive an object with ServiceTicketV1UnitOfWork property', () => {
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('ServiceTicketV1UnitOfWork');
    });

    And('the ServiceTicketV1UnitOfWork should be properly initialized', () => {
      expect(result.ServiceTicketV1UnitOfWork).toBeDefined();
      expect(typeof result.ServiceTicketV1UnitOfWork).toBe('object');
      expect(result.ServiceTicketV1UnitOfWork).toHaveProperty('withTransaction');
      expect(result.ServiceTicketV1UnitOfWork).toHaveProperty('withScopedTransaction');
      expect(result.ServiceTicketV1UnitOfWork).toHaveProperty('withScopedTransactionById');
    });
  });
});