import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';

import type { Passport } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { ServicePersistence } from './index.ts';
import type { ServiceModelType } from '@ocom/data-sources-mongoose-models/service';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexFeature = await loadFeature(
  path.resolve(__dirname, 'features/index.feature')
);

function makeMockModelsContext() {
  return {
    Service: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
        updateOne: vi.fn(),
        deleteOne: vi.fn(),
      } as unknown as ServiceModelType,
  } as unknown as Parameters<typeof ServicePersistence>[0];
}

function makeMockPassport() {
  return {
    community: {
      forCommunity: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
    service: {
      forService: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Passport;
}

test.for(indexFeature, ({ Scenario, Background, BeforeEachScenario }) => {
  let models: Parameters<typeof ServicePersistence>[0];
  let passport: Passport;
  let result: ReturnType<typeof ServicePersistence>;

  BeforeEachScenario(() => {
    models = makeMockModelsContext();
    passport = makeMockPassport();
    result = {} as ReturnType<typeof ServicePersistence>;
  });

  Background(({ Given, And }) => {
    Given('a valid models context with Service model', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid passport for domain operations', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Creating service persistence', ({ When, Then, And }) => {
    When('I call ServicePersistence with models and passport', () => {
      result = ServicePersistence(models, passport);
    });

    Then('I should receive an object with ServiceUnitOfWork property', () => {
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('ServiceUnitOfWork');
    });

    And('the ServiceUnitOfWork should be properly initialized', () => {
      expect(result.ServiceUnitOfWork).toBeDefined();
      expect(typeof result.ServiceUnitOfWork).toBe('object');
      expect(result.ServiceUnitOfWork).toHaveProperty('withTransaction');
      expect(result.ServiceUnitOfWork).toHaveProperty('withScopedTransaction');
      expect(result.ServiceUnitOfWork).toHaveProperty('withScopedTransactionById');
    });
  });
});