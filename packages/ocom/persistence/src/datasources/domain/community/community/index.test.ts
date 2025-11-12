import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Passport } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { CommunityPersistence } from './index.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/index.feature')
);

function makeMockModelsContext() {
  return {
    Community: {
      Community: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
        updateOne: vi.fn(),
        deleteOne: vi.fn(),
      } as unknown as Models.Community.CommunityModelType,
    },
  } as unknown as Parameters<typeof CommunityPersistence>[0];
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
  let models: Parameters<typeof CommunityPersistence>[0];
  let passport: Passport;
  let result: ReturnType<typeof CommunityPersistence>;

  BeforeEachScenario(() => {
    models = makeMockModelsContext();
    passport = makeMockPassport();
    result = {} as ReturnType<typeof CommunityPersistence>;
  });

  Background(({ Given, And }) => {
    Given('a valid models context with Community model', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid passport for domain operations', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Creating Community Persistence', ({ When, Then, And }) => {
    When('I call CommunityPersistence with models and passport', () => {
      result = CommunityPersistence(models, passport);
    });

    Then('I should receive an object with CommunityUnitOfWork property', () => {
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('CommunityUnitOfWork');
    });

    And('the CommunityUnitOfWork should be properly initialized', () => {
      expect(result.CommunityUnitOfWork).toBeDefined();
      expect(typeof result.CommunityUnitOfWork).toBe('object');
      expect(result.CommunityUnitOfWork).toHaveProperty('withTransaction');
      expect(result.CommunityUnitOfWork).toHaveProperty('withScopedTransaction');
      expect(result.CommunityUnitOfWork).toHaveProperty('withScopedTransactionById');
    });
  });
});