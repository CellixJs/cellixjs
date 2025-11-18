import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { expect, vi } from 'vitest';
import { getMemberUnitOfWork } from './member.uow.ts';
// Direct imports from domain package
import type * as Member from '@ocom/domain/contexts/member';
import type { Passport } from '@ocom/domain/contexts/passport';
import { Member as MemberClass } from '@ocom/domain/contexts/member';



const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/member.uow.feature')
);

function makeMockMemberModel() {
  return {
    findById: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
  } as unknown as Models.Member.MemberModelType;
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
  let memberModel: Models.Member.MemberModelType;
  let passport: Passport;
  let result: Member.MemberUnitOfWork;

  BeforeEachScenario(() => {
    memberModel = makeMockMemberModel();
    passport = makeMockPassport();
    result = {} as Member.MemberUnitOfWork;
  });

  Background(({ Given, And }) => {
    Given('a Mongoose context factory with a working service', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid Member model from the models context', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid passport for domain operations', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Creating a Member Unit of Work', ({ When, Then, And }) => {
    When('I call getMemberUnitOfWork with the Member model and passport', () => {
      result = getMemberUnitOfWork(memberModel, passport);
    });

    Then('I should receive a properly initialized MemberUnitOfWork', () => {
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