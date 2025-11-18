import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { ModelsContext } from '../../../../index.ts';
import { EndUserReadRepositoryImpl } from './end-user.read-repository.ts';
import { EndUserDataSourceImpl } from './end-user.data.ts';
import { EndUserConverter } from '../../../domain/user/end-user/end-user.domain-adapter.ts';
// Direct imports from domain package
import type { Passport } from '@ocom/domain/contexts/passport';


// Mock the data source module

const test = { for: describeFeature };
vi.mock('./end-user.data.ts', () => ({
  EndUserDataSourceImpl: vi.fn(),
}));

// Mock the converter module
vi.mock('../../../domain/user/end-user/end-user.domain-adapter.ts', () => ({
  EndUserConverter: vi.fn(),
}));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/end-user.read-repository.feature')
);

function makeMockModelsContext() {
  return {
    User: {
      EndUser: {} as unknown as Models.User.EndUserModelType,
    },
  } as ModelsContext;
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

function makeMockEndUserDocument() {
  return {
    _id: 'test-id',
    externalId: 'ext-123',
    email: 'test@example.com',
    displayName: 'Test User',
    userType: 'end-user',
    createdAt: new Date(),
    updatedAt: new Date(),
    id: 'test-id',
  } as unknown as Models.User.EndUser;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let models: ModelsContext;
  let passport: Passport;
  let repository: EndUserReadRepositoryImpl;
  let mockEndUserDoc: Models.User.EndUser;
  let mockDataSource: {
    find: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    aggregate: ReturnType<typeof vi.fn>;
  };
  let mockConverter: {
    toDomain: ReturnType<typeof vi.fn>;
  };

  BeforeEachScenario(() => {
    models = makeMockModelsContext();
    passport = makeMockPassport();
    mockEndUserDoc = makeMockEndUserDocument();

    // Mock the data source
    mockDataSource = {
      find: vi.fn(async () => [mockEndUserDoc]),
      findById: vi.fn(async (id: string) => id === 'test-id' ? mockEndUserDoc : null),
      findOne: vi.fn(async (filter: Partial<Models.User.EndUser>) => filter.externalId === 'ext-123' ? mockEndUserDoc : null),
      aggregate: vi.fn(async () => []),
    };

    // Mock the converter
    mockConverter = {
      toDomain: vi.fn((doc, passport) => ({
        id: doc.id,
        externalId: doc.externalId,
        email: doc.email,
        displayName: doc.displayName,
        userType: doc.userType,
        passport,
      })),
    };

    // Mock the constructors
    vi.mocked(EndUserDataSourceImpl).mockImplementation(() => mockDataSource as unknown as InstanceType<typeof EndUserDataSourceImpl>);
    vi.mocked(EndUserConverter).mockImplementation(() => mockConverter as unknown as EndUserConverter);

    repository = new EndUserReadRepositoryImpl(models, passport);
  });

  Scenario('Creating End User Read Repository', ({ When, Then, And }) => {
    When('I create a EndUserReadRepositoryImpl with models and passport', () => {
      // Repository is already created in BeforeEachScenario
    });

    Then('I should receive a EndUserReadRepository instance', () => {
      expect(repository).toBeDefined();
      expect(repository).toBeInstanceOf(EndUserReadRepositoryImpl);
    });

    And('the repository should have all required methods', () => {
      expect(typeof repository.getAll).toBe('function');
      expect(typeof repository.getById).toBe('function');
      expect(typeof repository.getByExternalId).toBe('function');
      expect(typeof repository.getByName).toBe('function');
    });
  });

  Scenario('Getting all end users', ({ When, Then }) => {
    When('I call getAll method', async () => {
      await repository.getAll();
    });

    Then('I should receive an array of EndUserEntityReference objects', () => {
      expect(mockDataSource.find).toHaveBeenCalledWith({}, undefined);
    });
  });

  Scenario('Getting end user by ID when exists', ({ Given, When, Then }) => {
    Given('an end user exists with ID "test-id"', () => {
      // Mock is already set up in BeforeEachScenario
    });

    When('I call getById with "test-id"', async () => {
      await repository.getById('test-id');
    });

    Then('I should receive the EndUserEntityReference object', () => {
      expect(mockDataSource.findById).toHaveBeenCalledWith('test-id', undefined);
      expect(mockConverter.toDomain).toHaveBeenCalledWith(mockEndUserDoc, passport);
    });
  });

  Scenario('Getting end user by ID when not exists', ({ Given, When, Then }) => {
    Given('no end user exists with ID "non-existent-id"', () => {
      mockDataSource.findById.mockResolvedValueOnce(null);
    });

    When('I call getById with "non-existent-id"', async () => {
      const result = await repository.getById('non-existent-id');
      expect(result).toBeNull();
    });

    Then('I should receive null', () => {
      expect(mockDataSource.findById).toHaveBeenCalledWith('non-existent-id', undefined);
    });
  });

  Scenario('Getting end user by external ID when exists', ({ Given, When, Then }) => {
    Given('an end user exists with external ID "ext-123"', () => {
      // Mock is already set up in BeforeEachScenario
    });

    When('I call getByExternalId with "ext-123"', async () => {
      await repository.getByExternalId('ext-123');
    });

    Then('I should receive the EndUserEntityReference object', () => {
      expect(mockDataSource.findOne).toHaveBeenCalledWith({ externalId: 'ext-123' }, undefined);
      expect(mockConverter.toDomain).toHaveBeenCalledWith(mockEndUserDoc, passport);
    });
  });

  Scenario('Getting end user by external ID when not exists', ({ Given, When, Then }) => {
    Given('no end user exists with external ID "non-existent-ext-id"', () => {
      mockDataSource.findOne.mockResolvedValueOnce(null);
    });

    When('I call getByExternalId with "non-existent-ext-id"', async () => {
      const result = await repository.getByExternalId('non-existent-ext-id');
      expect(result).toBeNull();
    });

    Then('I should receive null', () => {
      expect(mockDataSource.findOne).toHaveBeenCalledWith({ externalId: 'non-existent-ext-id' }, undefined);
    });
  });

  Scenario('Getting end users by name', ({ Given, When, Then }) => {
    Given('end users exist with display name "Test User"', () => {
      // Mock is already set up in BeforeEachScenario
    });

    When('I call getByName with "Test User"', async () => {
      await repository.getByName('Test User');
    });

    Then('I should receive an array of EndUserEntityReference objects', () => {
      expect(mockDataSource.find).toHaveBeenCalledWith({ displayName: 'Test User' }, undefined);
      expect(mockConverter.toDomain).toHaveBeenCalledWith(mockEndUserDoc, passport);
    });
  });
});