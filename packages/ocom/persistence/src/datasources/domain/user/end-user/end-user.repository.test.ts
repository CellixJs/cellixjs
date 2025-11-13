import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { Passport } from '@ocom/domain';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { EndUserRepository } from './end-user.repository.ts';
import { EndUserConverter, type EndUserDomainAdapter } from './end-user.domain-adapter.ts';
import type * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { ClientSession } from 'mongoose';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/end-user.repository.feature')
);

function makeEndUserDoc(overrides: Partial<Models.User.EndUser> = {}) {
  const base = {
    id:'user-1',
    externalId: '123e4567-e89b-12d3-a456-426614174001',
    email: 'user@example.com',
    displayName: 'Test User',
    userType: 'end-user',
    accessBlocked: false,
    tags: [],
    personalInformation: {
      identityDetails: {
        lastName: 'Smith',
        legalNameConsistsOfOneName: false,
        restOfName: 'Alice',
      },
      contactInformation: {
        email: 'user@example.com',
      },
    },
    set(key: keyof Models.User.EndUser, value: unknown) {
      (this as Models.User.EndUser)[key] = value as never;
    },
    ...overrides,
  } as Models.User.EndUser;
  return vi.mocked(base);
}

function makeMockPassport() {
  return {
    user: {
      forEndUser: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let repo: EndUserRepository<EndUserDomainAdapter>;
  let converter: EndUserConverter;
  let passport: Passport;
  let endUserDoc: Models.User.EndUser;
  let model: Models.User.EndUserModelType;
  let eventBus: DomainSeedwork.EventBus;
  let session: ClientSession;

  BeforeEachScenario(() => {
    endUserDoc = makeEndUserDoc();
    converter = new EndUserConverter();
    passport = makeMockPassport();

    // Mock the Mongoose model as a constructor function with static methods
    const ModelMock = function (this: Models.User.EndUser) {
      Object.assign(this, makeEndUserDoc());
    }
    Object.assign(ModelMock, {
      findOne: vi.fn((query: { externalId: string }) => ({
        exec: vi.fn(async () => (query.externalId === endUserDoc.externalId ? endUserDoc : null)),
      })),
      deleteOne: vi.fn(() => ({
        exec: vi.fn(async () => ({})),
      })),
      prototype: {},
    });

    eventBus = { publish: vi.fn() } as unknown as DomainSeedwork.EventBus;
    session = { startTransaction: vi.fn(), endSession: vi.fn() } as unknown as ClientSession;

    repo = new EndUserRepository(
      passport,
      ModelMock as unknown as Models.User.EndUserModelType,
      converter,
      eventBus,
      session
    );

    model = ModelMock as unknown as Models.User.EndUserModelType;
  });

  Background(({ Given, And }) => {
    Given(
      'an EndUserRepository instance with a working Mongoose model, type converter, and passport',
      () => {
        // Already set up in BeforeEachScenario
      }
    );
    And(
      'a valid Mongoose EndUser document with externalId "123e4567-e89b-12d3-a456-426614174001", email "user@example.com", displayName "Test User", and userType "end-user"',
      () => {
        endUserDoc = makeEndUserDoc();
      }
    );
  });

  Scenario('Getting an end user by externalId', ({ When, Then, And }) => {
    let result: EndUser<EndUserDomainAdapter>;
    When('I call getByExternalId with "123e4567-e89b-12d3-a456-426614174001"', async () => {
      result = await repo.getByExternalId('123e4567-e89b-12d3-a456-426614174001');
    });
    Then('I should receive an EndUser domain object', () => {
      expect(result).toBeInstanceOf(EndUser);
    });
    And('the domain object\'s email should be "user@example.com"', () => {
      expect(result.email).toBe('user@example.com');
    });
    And('the domain object\'s displayName should be "Test User"', () => {
      expect(result.displayName).toBe('Test User');
    });
  });

  Scenario('Getting an end user by externalId that does not exist', ({ When, Then }) => {
    let getByExternalId: () => Promise<unknown>;
    When('I call getByExternalId with "nonexistent-id"', () => {
      getByExternalId = async () => await repo.getByExternalId('nonexistent-id');
    });
    Then('an error should be thrown indicating "User with externalId nonexistent-id not found"', async () => {
      await expect(getByExternalId).rejects.toThrow();
      await expect(getByExternalId).rejects.toThrow(/User with externalId nonexistent-id not found/);
    });
  });

  Scenario('Creating a new end user instance', ({ When, Then, And }) => {
    let result: EndUser<EndUserDomainAdapter>;
    When('I call getNewInstance with externalId "123e4567-e89b-12d3-a456-426614174002", lastName "Smith", restOfName "Alice", and email "alice@example.com"', async () => {
      result = await repo.getNewInstance(
        '123e4567-e89b-12d3-a456-426614174002',
        'Smith',
        'Alice',
        'alice@example.com'
      );
    });
    Then('I should receive a new EndUser domain object', () => {
      expect(result).toBeInstanceOf(EndUser);
    });
    And('the domain object\'s externalId should be "123e4567-e89b-12d3-a456-426614174002"', () => {
      expect(result.externalId).toBe('123e4567-e89b-12d3-a456-426614174002');
    });
    And('the domain object\'s displayName should be "Alice Smith"', () => {
      expect(result.displayName).toBe('Alice Smith');
    });
    And('the domain object\'s email should be "alice@example.com"', () => {
      expect(result.personalInformation.contactInformation.email).toBe('alice@example.com');
    });
  });

  Scenario('Creating a new end user instance with no restOfName', ({ When, Then, And }) => {
    let result: EndUser<EndUserDomainAdapter>;
    When('I call getNewInstance with externalId "123e4567-e89b-12d3-a456-426614174003", lastName "Smith", restOfName undefined, and email "smith@example.com"', async () => {
      result = await repo.getNewInstance(
        '123e4567-e89b-12d3-a456-426614174003',
        'Smith',
        undefined,
        'smith@example.com'
      );
    });
    Then('I should receive a new EndUser domain object', () => {
      expect(result).toBeInstanceOf(EndUser);
    });
    And('the domain object\'s externalId should be "123e4567-e89b-12d3-a456-426614174003"', () => {
      expect(result.externalId).toBe('123e4567-e89b-12d3-a456-426614174003');
    });
    And('the domain object\'s displayName should be "Smith"', () => {
      expect(result.displayName).toBe('Smith');
      expect((result as EndUser<EndUserDomainAdapter>).displayName).toBe('Smith');
    });
    And('the domain object\'s email should be "smith@example.com"', () => {
      expect(result.personalInformation.contactInformation.email).toBe('smith@example.com');
    });
  });

  Scenario('Deleting an end user by id', ({ When, Then }) => {
    When('I call delete with "123e4567-e89b-12d3-a456-426614174001"', async () => {
      await repo.delete('123e4567-e89b-12d3-a456-426614174001');
    });
    Then('the user with id "123e4567-e89b-12d3-a456-426614174001" should be removed from the database', () => {
      expect(model.deleteOne).toHaveBeenCalledWith({ _id: '123e4567-e89b-12d3-a456-426614174001' });
    });
  });
});