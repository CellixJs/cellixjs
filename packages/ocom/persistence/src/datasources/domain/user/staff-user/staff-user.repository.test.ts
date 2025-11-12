import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { Passport } from '@ocom/domain';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { StaffUserRepository } from './staff-user.repository.ts';
import { StaffUserConverter, type StaffUserDomainAdapter } from './staff-user.domain-adapter.ts';
import type * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { ClientSession } from 'mongoose';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/staff-user.repository.feature')
);

function makeStaffUserDoc(overrides: Partial<Models.User.StaffUser> = {}) {
  const base = {
    id: '507f1f77bcf86cd799439011',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    displayName: 'John Doe',
    externalId: '12345678-1234-1234-8123-123456789012',
    accessBlocked: false,
    tags: [],
    role: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    schemaVersion: '1.0.0',
    set(key: keyof Models.User.StaffUser, value: unknown) {
      (this as Models.User.StaffUser)[key] = value as never;
    },
    ...overrides,
  } as Models.User.StaffUser;
  return vi.mocked(base);
}

function makeMockPassport() {
  return {
    user: {
      forStaffUser: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Domain.Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let repo: StaffUserRepository;
  let converter: StaffUserConverter;
  let passport: Passport;
  let staffUserDoc: Models.User.StaffUser;
  let result: Domain.Contexts.User.StaffUser.StaffUser<StaffUserDomainAdapter>;
  let findByIdAndDeleteMock: ReturnType<typeof vi.fn>;

  BeforeEachScenario(() => {
    staffUserDoc = makeStaffUserDoc();
    converter = new StaffUserConverter();
    passport = makeMockPassport();
    result = {} as Domain.Contexts.User.StaffUser.StaffUser<StaffUserDomainAdapter>;

    // Mock the Mongoose model as a constructor function with static methods
    const ModelMock = function (this: Models.User.StaffUser) {
      Object.assign(this, makeStaffUserDoc());
    };

    // Attach static methods to the constructor
    findByIdAndDeleteMock = vi.fn((id: string) => ({
      exec: vi.fn(async () => (id === '507f1f77bcf86cd799439011' ? {} : null)),
    }));

    Object.assign(ModelMock, {
      findById: vi.fn((id: string) => ({
        populate: vi.fn(() => ({
          exec: vi.fn(async () => (id === '507f1f77bcf86cd799439011' ? staffUserDoc : null)),
        })),
      })),
      findOne: vi.fn((query: Record<string, unknown>) => ({
        populate: vi.fn(() => ({
          // biome-ignore lint:useLiteralKeys
          exec: vi.fn(async () => (query['externalId'] === '12345678-1234-1234-8123-123456789012' ? staffUserDoc : null)),
        })),
      })),
      findByIdAndDelete: findByIdAndDeleteMock,
    });

    // Provide minimal eventBus and session mocks
    const eventBus = { publish: vi.fn() } as unknown as DomainSeedwork.EventBus;
    const session = { startTransaction: vi.fn(), endSession: vi.fn() } as unknown as ClientSession;

    // Create repository with correct constructor parameters
    repo = new StaffUserRepository(
      passport,
      ModelMock as unknown as Models.User.StaffUserModelType,
      converter,
      eventBus,
      session
    );
  });

  Background(({ Given }) => {
    Given('a StaffUserRepository instance with a valid model and passport', () => {
      // Already set up in BeforeEachScenario
    });
  });

  Scenario('Getting a staff user by ID', ({ Given, When, Then, And }) => {
    Given('a staff user exists in the database with ID "507f1f77bcf86cd799439011"', () => {
      // Already mocked in BeforeEachScenario
    });
    When('I call getById with "507f1f77bcf86cd799439011"', async () => {
      result = await repo.getById('507f1f77bcf86cd799439011');
    });
    Then('it should return the staff user aggregate by ID', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.User.StaffUser.StaffUser);
    });
    And('the staff user by ID should have the correct properties', () => {
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.email).toBe('john.doe@example.com');
    });
  });

  Scenario('Getting a staff user by ID that doesn\'t exist', ({ Given, When, Then }) => {
    Given('no staff user exists with ID "507f1f77bcf86cd799439012"', () => {
      // Already mocked to return null
    });
    When('I call getById with "507f1f77bcf86cd799439012"', async () => {
      // Test will check the error
    });
    Then('it should throw an error indicating "StaffUser with id 507f1f77bcf86cd799439012 not found"', async () => {
      await expect(repo.getById('507f1f77bcf86cd799439012')).rejects.toThrow(
        'StaffUser with id 507f1f77bcf86cd799439012 not found'
      );
    });
  });

  Scenario('Getting a staff user by external ID', ({ Given, When, Then, And }) => {
    Given('a staff user exists in the database with externalId "12345678-1234-1234-8123-123456789012"', () => {
      // Already mocked in BeforeEachScenario
    });
    When('I call getByExternalId with "12345678-1234-1234-8123-123456789012"', async () => {
      result = await repo.getByExternalId('12345678-1234-1234-8123-123456789012');
    });
    Then('it should return the staff user aggregate by external ID', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.User.StaffUser.StaffUser);
    });
    And('the staff user by external ID should have the correct properties', () => {
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.email).toBe('john.doe@example.com');
    });
  });

  Scenario('Getting a staff user by external ID that doesn\'t exist', ({ Given, When, Then }) => {
    Given('no staff user exists with externalId "87654321-4321-4321-4321-210987654321"', () => {
      // Already mocked to return null
    });
    When('I call getByExternalId with "87654321-4321-4321-4321-210987654321"', async () => {
      // Test will check the error
    });
    Then('it should throw an error indicating "StaffUser with externalId 87654321-4321-4321-4321-210987654321 not found"', async () => {
      await expect(repo.getByExternalId('87654321-4321-4321-4321-210987654321')).rejects.toThrow(
        'StaffUser with externalId 87654321-4321-4321-4321-210987654321 not found'
      );
    });
  });

  Scenario('Creating a new staff user instance', ({ Given, When, Then, And }) => {
    Given('valid parameters for a new staff user', () => {
      // Already set up
    });
    When('I call getNewInstance with externalId "12345678-1234-1234-8123-123456789012", firstName "John", lastName "Doe", email "john.doe@example.com"', async () => {
      result = await repo.getNewInstance(
        '12345678-1234-1234-8123-123456789012',
        'John',
        'Doe',
        'john.doe@example.com'
      );
    });
    Then('it should return a new staff user aggregate', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.User.StaffUser.StaffUser);
    });
    And('the new staff user should have tags set to an empty array', () => {
      expect(result.tags).toEqual([]);
    });
    And('the new staff user should have accessBlocked set to false', () => {
      expect(result.accessBlocked).toBe(false);
    });
  });

  Scenario('Deleting a staff user by ID', ({ Given, When, Then }) => {
    Given('a staff user exists in the database with ID "507f1f77bcf86cd799439011"', () => {
      // Already mocked in BeforeEachScenario
    });
    When('I call delete with "507f1f77bcf86cd799439011"', async () => {
      await repo.delete('507f1f77bcf86cd799439011');
    });
    Then('the staff user should be deleted from the database', () => {
      expect(findByIdAndDeleteMock).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });
});