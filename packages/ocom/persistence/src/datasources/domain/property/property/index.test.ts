import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Domain } from '@ocom/domain';
import { PropertyPersistence } from './index.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/index.feature')
);

function makeMockModelsContext() {
  return {
    Property: {
      Property: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
        updateOne: vi.fn(),
        deleteOne: vi.fn(),
        findByIdAndDelete: vi.fn(),
        findOne: vi.fn(),
      } as unknown as Models.Property.PropertyModelType,
    },
  } as unknown as Parameters<typeof PropertyPersistence>[0];
}

function makeMockPassport() {
  return {
    property: {
      forProperty: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Domain.Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let models: Parameters<typeof PropertyPersistence>[0];
  let passport: Domain.Passport;
  let result: ReturnType<typeof PropertyPersistence>;

  BeforeEachScenario(() => {
    models = makeMockModelsContext();
    passport = makeMockPassport();
    result = {} as ReturnType<typeof PropertyPersistence>;
  });

  Background(({ Given, And }) => {
    Given('a valid models context with Property model', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid passport for domain operations', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Creating Property Persistence', ({ When, Then, And }) => {
    When('I call PropertyPersistence with models and passport', () => {
      result = PropertyPersistence(models, passport);
    });

    Then('I should receive an object with PropertyUnitOfWork property', () => {
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('PropertyUnitOfWork');
    });

    And('the PropertyUnitOfWork should be properly initialized', () => {
      expect(result.PropertyUnitOfWork).toBeDefined();
      expect(typeof result.PropertyUnitOfWork).toBe('object');
      expect(result.PropertyUnitOfWork).toHaveProperty('withTransaction');
      expect(result.PropertyUnitOfWork).toHaveProperty('withScopedTransaction');
      expect(result.PropertyUnitOfWork).toHaveProperty('withScopedTransactionById');
    });
  });
});