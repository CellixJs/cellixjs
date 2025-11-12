import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import { Passport } from '@ocom/domain';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { ServiceRepository } from './service.repository.ts';
import { ServiceConverter } from './service.domain-adapter.ts';
import type * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { ClientSession } from 'mongoose';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repositoryFeature = await loadFeature(
  path.resolve(__dirname, 'features/service.repository.feature')
);

function makeServiceDoc(overrides: Partial<Models.Service.Service> = {}) {
  return {
    serviceName: 'Test Service',
    description: 'Test service description',
    isActive: true,
    community: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    set(key: keyof Models.Service.Service, value: unknown) {
      // Type-safe property assignment
      (this as Models.Service.Service)[key] = value as never;
    },
    populate(path: string) {
      // Mock populate method for testing
      if (path === 'community' && this.community instanceof MongooseSeedwork.ObjectId) {
        this.community = makeCommunityDoc();
      }
      return this;
    },
    ...overrides,
  } as Models.Service.Service;
}

function makeCommunityDoc(overrides: Partial<Models.Community.Community> = {}) {
  const base = {
    id: '6898b0c34b4a2fbc01e9c697',
    name: 'Test Community',
    domain: 'test.com',
    ...overrides,
  } as Models.Community.Community;
  return vi.mocked(base);
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
  } as unknown as Domain.Passport;
}

test.for(repositoryFeature, ({ Scenario, Background, BeforeEachScenario }) => {
  let repository: ServiceRepository;
  let converter: ServiceConverter;
  let passport: Passport;
  let mockModel: Models.Service.ServiceModelType;
  let result: unknown;

  BeforeEachScenario(() => {
    converter = new ServiceConverter();
    passport = makeMockPassport();

    // Mock the Mongoose model as a constructor function with static methods
    const ModelMock = function (this: Models.Service.Service) {
      Object.assign(this, makeServiceDoc());
    };
    // Attach static methods to the constructor
    Object.assign(ModelMock, {
      findById: vi.fn((id: string) => ({
        populate: vi.fn().mockReturnThis(),
        exec: vi.fn(async () => (id === '123' ? makeServiceDoc({ _id: id }) : null)),
      })),
    });

    // Provide minimal eventBus and session mocks
    const eventBus = { publish: vi.fn() } as unknown as DomainSeedwork.EventBus;
    const session = { startTransaction: vi.fn(), endSession: vi.fn() } as unknown as ClientSession;

    mockModel = ModelMock as unknown as Models.Service.ServiceModelType;
    repository = new ServiceRepository(passport, mockModel, converter, eventBus, session);
    result = undefined;
  });

  Background(({ Given }) => {
    Given('a ServiceRepository instance with a mock model and converter', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Getting a service by ID when the service exists', ({ Given, When, Then, And }) => {
    Given('a service document exists in the database with ID "123"', () => {
      // Mock is set up in BeforeEachScenario
    });
    When('I call getById with ID "123"', async () => {
      result = await repository.getById('123');
    });
    Then('it should return a Service domain object', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.Service.Service.Service);
    });
    And('the model\'s findById method should have been called with "123"', () => {
      expect(mockModel.findById).toHaveBeenCalledWith('123');
    });
  });

  Scenario('Getting a service by ID when the service does not exist', ({ Given, When, Then }) => {
    let gettingServiceThatDoesNotExist: () => Promise<Domain.Contexts.Service.Service.Service<Domain.Contexts.Service.Service.ServiceProps>>;
    Given('no service document exists in the database with ID "999"', () => {
      // Mock is set up in BeforeEachScenario
    });
    When('I call getById with "999"', () => {
      gettingServiceThatDoesNotExist = async () => await repository.getById('999');
    });
    Then('an error should be thrown indicating "Service with id 999 not found"', async () => {
      await expect(gettingServiceThatDoesNotExist).rejects.toThrow();
      await expect(gettingServiceThatDoesNotExist).rejects.toThrow(/Service with id 999 not found/);
    });
  });

  Scenario('Getting a new service instance', ({ Given, When, Then }) => {
    let communityRef: Domain.Contexts.Community.Community.CommunityEntityReference;
    Given('a valid community reference', () => {
      communityRef = { id: '507f1f77bcf86cd799439012' } as Domain.Contexts.Community.Community.CommunityEntityReference;
    });
    When('I call getNewInstance with service name "New Service", description "New description", and community reference', async () => {
      result = await repository.getNewInstance('New Service', 'New description', communityRef);
    });
    Then('it should return a new Service domain object', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.Service.Service.Service);
    });
  });
});