import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { expect, vi } from 'vitest';
import { getCommunityUnitOfWork } from './community.uow.ts';
// Direct imports from domain package
import type { CommunityUnitOfWork } from '@ocom/domain/contexts/community';
import type { Passport } from '@ocom/domain/contexts/passport';
import { Community as CommunityClass } from '@ocom/domain/contexts/community';



const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/community.uow.feature')
);

function makeMockCommunityModel() {
  return {
    findById: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
  } as unknown as Models.Community.CommunityModelType;
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
  let communityModel: Models.Community.CommunityModelType;
  let passport: Passport;
  let result: CommunityUnitOfWork;

  BeforeEachScenario(() => {
    communityModel = makeMockCommunityModel();
    passport = makeMockPassport();
    result = {} as CommunityUnitOfWork;
  });

  Background(({ Given, And }) => {
    Given('a Mongoose context factory with a working service', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid Community model from the models context', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid passport for domain operations', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Creating a Community Unit of Work', ({ When, Then, And }) => {
    When('I call getCommunityUnitOfWork with the Community model and passport', () => {
      result = getCommunityUnitOfWork(communityModel, passport);
    });

    Then('I should receive a properly initialized CommunityUnitOfWork', () => {
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