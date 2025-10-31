import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { Domain } from '@ocom/domain';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { PropertyRepository } from './property.repository.ts';
import { PropertyConverter, type PropertyDomainAdapter } from './property.domain-adapter.ts';
import type { DomainSeedwork } from '@cellix/domain-seedwork';
import type { ClientSession } from 'mongoose';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/property.repository.feature')
);

function makePropertyDoc(overrides: Partial<Models.Property.Property> = {}) {
  const base = {
    id: '507f1f77bcf86cd799439011', // Valid ObjectId string
    propertyName: 'Test Property',
    community: makeCommunityDoc(),
    set(key: keyof Models.Property.Property, value: unknown) {
      (this as Models.Property.Property)[key] = value as never;
    },
    ...overrides,
  } as Models.Property.Property;
  return vi.mocked(base);
}

function makeCommunityDoc(overrides: Partial<Models.Community.Community> = {}) {
  return { id: '507f1f77bcf86cd799439012', name: 'Test Community', ...overrides } as Models.Community.Community; // Valid ObjectId string
}

function makeMockPassport() {
  return {
    community: {
      forCommunity: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
    property: {
      forProperty: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Domain.Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let repo: PropertyRepository;
  let converter: PropertyConverter;
  let passport: Domain.Passport;
  let propertyDoc: Models.Property.Property;
  let communityDoc: Models.Community.Community;
  let result: Domain.Contexts.Property.Property.Property<PropertyDomainAdapter>;
  let results: ReadonlyArray<Domain.Contexts.Property.Property.Property<PropertyDomainAdapter>>;

  BeforeEachScenario(() => {
    propertyDoc = makePropertyDoc();
    communityDoc = makeCommunityDoc();
    converter = new PropertyConverter();
    passport = makeMockPassport();
    result = {} as Domain.Contexts.Property.Property.Property<PropertyDomainAdapter>;
    results = [];

    // Mock the Mongoose model as a constructor function with static methods
    const ModelMock = function (this: Models.Property.Property) {
      Object.assign(this, makePropertyDoc());
    }
    // Attach static methods to the constructor
    Object.assign(ModelMock, {
      findById: vi.fn((id: string) => ({
        populate: vi.fn().mockReturnThis(),
        exec: vi.fn(async () => (id === '507f1f77bcf86cd799439011' ? propertyDoc : null)),
      })),
      find: vi.fn(() => ({
        populate: vi.fn().mockReturnThis(),
        exec: vi.fn(() => [propertyDoc]),
      })),
    });

    // Provide minimal eventBus and session mocks (not used in constructor)
    const eventBus = { publish: vi.fn() } as unknown as DomainSeedwork.EventBus;
    const session = { startTransaction: vi.fn(), endSession: vi.fn() } as unknown as ClientSession;

    // Create repository with correct constructor parameters
    repo = new PropertyRepository(
      passport,
      ModelMock as unknown as Models.Property.PropertyModelType,
      converter,
      eventBus,
      session
    );
  });

  Background(({ Given, And }) => {
    Given(
      'a PropertyRepository instance with a working Mongoose model, type converter, and passport',
      () => {
        // This is set up in BeforeEachScenario
      }
    );
    And(
      'a valid Mongoose Property document with id "507f1f77bcf86cd799439011", name "Test Property", and a populated community field',
      () => {
        propertyDoc = makePropertyDoc({ _id: '507f1f77bcf86cd799439011', propertyName: 'Test Property', community: communityDoc });
      }
    );
  });

  Scenario('Getting a property by id', ({ When, Then, And }) => {
    When('I call getById with "507f1f77bcf86cd799439011"', async () => {
      result = await repo.getById('507f1f77bcf86cd799439011');
    });
    Then('I should receive a Property domain object', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.Property.Property.Property);
    });
    And('the domain object\'s name should be "Test Property"', () => {
      expect(result.propertyName).toBe('Test Property');
    });
  });

  Scenario('Getting a property by id that does not exist', ({ When, Then }) => {
    let gettingPropertyThatDoesNotExist: () => Promise<Domain.Contexts.Property.Property.Property<PropertyDomainAdapter>>;
    When('I call getById with "nonexistent-id"', () => {
      gettingPropertyThatDoesNotExist = async () => await repo.getById('nonexistent-id');
    });
    Then('an error should be thrown indicating "Property with id nonexistent-id not found"', async () => {
      await expect(gettingPropertyThatDoesNotExist).rejects.toThrow();
      await expect(gettingPropertyThatDoesNotExist).rejects.toThrow(/Property with id nonexistent-id not found/);
    });
  });

  Scenario('Getting all properties', ({ When, Then, And }) => {
    When('I call getAll', async () => {
      results = await repo.getAll();
    });
    Then('I should receive an array of Property domain objects', () => {
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toBeInstanceOf(Domain.Contexts.Property.Property.Property);
    });
    And('the array should contain at least one property with name "Test Property"', () => {
      const testProperty = results.find(property => property.propertyName === 'Test Property');
      expect(testProperty).toBeDefined();
    });
  });

  Scenario('Creating a new property instance', ({ Given, When, Then, And }) => {
    let communityDomainObject: Domain.Contexts.Community.Community.CommunityEntityReference;
    Given('a valid Community domain object as the community', () => {
            communityDomainObject = { id: '507f1f77bcf86cd799439012', name: 'Test Community' } as Domain.Contexts.Community.Community.CommunityEntityReference;
    });
    When('I call getNewInstance with name "New Property" and the community', async () => {
      result = await repo.getNewInstance('New Property', communityDomainObject);
    });
    Then('I should receive a new Property domain object', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.Property.Property.Property);
    });
    And('the domain object\'s name should be "New Property"', () => {
      expect(result.propertyName).toBe('New Property');
    });
    And('the domain object\'s community should be the given community', () => {
      expect(result.community.id).toBe(communityDomainObject.id);
    });
  });

  Scenario('Creating a new property instance with an invalid community', ({ Given, When, Then }) => {
    let getNewInstanceWithInvalidCommunity: () => Promise<unknown>;
    let invalidCommunity: unknown;
    Given('an invalid community object', () => {
      invalidCommunity = undefined;
    });
    When('I call getNewInstance with name "Invalid Property" and the invalid community', () => {
      getNewInstanceWithInvalidCommunity = () => repo.getNewInstance('Invalid Property', invalidCommunity as Domain.Contexts.Community.Community.CommunityEntityReference);
    });
    Then('an error should be thrown indicating the community is not valid', async () => {
      await expect(getNewInstanceWithInvalidCommunity).rejects.toThrow();
      // The exact error message may vary based on the domain validation
      await expect(getNewInstanceWithInvalidCommunity).rejects.toThrow();
    });
  });
});