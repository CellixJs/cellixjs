import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';

import type { Domain } from '@ocom/domain';
import { MemberPersistence } from './index.ts';
import type { MemberModelType } from '@ocom/data-sources-mongoose-models/member';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/index.feature')
);

function makeMockModelsContext() {
  return {
    Member: {
      Member: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
        updateOne: vi.fn(),
        deleteOne: vi.fn(),
      } as unknown as MemberModelType,
    },
  } as unknown as Parameters<typeof MemberPersistence>[0];
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
  let models: Parameters<typeof MemberPersistence>[0];
  let passport: Domain.Passport;
  let result: ReturnType<typeof MemberPersistence>;

  BeforeEachScenario(() => {
    models = makeMockModelsContext();
    passport = makeMockPassport();
    result = {} as ReturnType<typeof MemberPersistence>;
  });

  Background(({ Given, And }) => {
    Given('a valid models context with Member model', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid passport for domain operations', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Creating Member Persistence', ({ When, Then, And }) => {
    When('I call MemberPersistence with models and passport', () => {
      result = MemberPersistence(models, passport);
    });

    Then('I should receive an object with MemberUnitOfWork property', () => {
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('MemberUnitOfWork');
    });

    And('the MemberUnitOfWork should be properly initialized', () => {
      expect(result.MemberUnitOfWork).toBeDefined();
      expect(typeof result.MemberUnitOfWork).toBe('object');
      expect(result.MemberUnitOfWork).toHaveProperty('withTransaction');
      expect(result.MemberUnitOfWork).toHaveProperty('withScopedTransaction');
      expect(result.MemberUnitOfWork).toHaveProperty('withScopedTransactionById');
    });
  });
});