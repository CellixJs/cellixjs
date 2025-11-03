import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { Domain } from '@ocom/domain';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { VendorUserRepository } from './vendor-user.repository.ts';
import { VendorUserConverter, type VendorUserDomainAdapter } from './vendor-user.domain-adapter.ts';
import type { DomainSeedwork } from '@cellix/domain-seedwork';
import type { ClientSession } from 'mongoose';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/vendor-user.repository.feature')
);

function makeVendorUserDoc(overrides: Partial<Models.User.VendorUser> = {}) {
  const base = {
    _id: '507f1f77bcf86cd799439011',
    id: '507f1f77bcf86cd799439011',
    userType: 'vendor-user',
    externalId: '123e4567-e89b-12d3-a456-426614174001',
    email: 'vendor@example.com',
    displayName: 'Test Vendor',
    accessBlocked: false,
    tags: ['tag1', 'tag2'],
    personalInformation: {
      identityDetails: {
        lastName: 'Doe',
        legalNameConsistsOfOneName: false,
        restOfName: 'John',
      },
      contactInformation: {
        email: 'vendor@example.com',
      },
    },
    set(key: keyof Models.User.VendorUser, value: unknown) {
      (this as Models.User.VendorUser)[key] = value as never;
    },
    ...overrides,
  } as Models.User.VendorUser;
  return vi.mocked(base);
}

function makeMockPassport() {
  return {
    user: {
      forVendorUser: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Domain.Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let repo: VendorUserRepository;
  let converter: VendorUserConverter;
  let passport: Domain.Passport;
  let vendorUserDoc: Models.User.VendorUser;
  let findByIdAndDeleteMock: ReturnType<typeof vi.fn>;

  BeforeEachScenario(() => {
    vendorUserDoc = makeVendorUserDoc();
    converter = new VendorUserConverter();
    passport = makeMockPassport();

    // Mock the Mongoose model as a constructor function with static methods
    const ModelMock = function (this: Models.User.VendorUser) {
      Object.assign(this, makeVendorUserDoc());
    };

    // Attach static methods to the constructor
    findByIdAndDeleteMock = vi.fn((id: string) => ({
      exec: vi.fn(async () => (id === '507f1f77bcf86cd799439011' ? {} : null)),
    }));

    Object.assign(ModelMock, {
      findById: vi.fn((id: string) => ({
        exec: vi.fn(async () => (id === vendorUserDoc._id ? vendorUserDoc : null)),
      })),
      findOne: vi.fn((query: { externalId: string }) => ({
        exec: vi.fn(async () => (query.externalId === vendorUserDoc.externalId ? vendorUserDoc : null)),
      })),
      findByIdAndDelete: findByIdAndDeleteMock,
    });

    const eventBus = { publish: vi.fn() } as unknown as DomainSeedwork.EventBus;
    const session = { startTransaction: vi.fn(), endSession: vi.fn() } as unknown as ClientSession;

    repo = new VendorUserRepository(
      passport,
      ModelMock as unknown as Models.User.VendorUserModelType,
      converter,
      eventBus,
      session
    );
  });

  Background(({ Given, And }) => {
    Given(
      'a VendorUserRepository instance with a working Mongoose model, type converter, and passport',
      () => {
        // Already set up in BeforeEachScenario
      }
    );
    And(
      'a VendorUser document with ID "507f1f77bcf86cd799439011" and externalId "123e4567-e89b-12d3-a456-426614174001"',
      () => {
        vendorUserDoc = makeVendorUserDoc();
      }
    );
  });

  Scenario('Getting a VendorUser by ID', ({ When, Then, And }) => {
    let result: Domain.Contexts.User.VendorUser.VendorUser<VendorUserDomainAdapter>;
    When('I call getById with ID "507f1f77bcf86cd799439011"', async () => {
      result = await repo.getById('507f1f77bcf86cd799439011');
    });
    Then('it should return the VendorUser domain object', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.User.VendorUser.VendorUser);
    });
    And('the domain object\'s externalId should be "123e4567-e89b-12d3-a456-426614174001"', () => {
      expect(result.externalId).toBe('123e4567-e89b-12d3-a456-426614174001');
    });
  });

  Scenario('Getting a VendorUser by external ID', ({ When, Then, And }) => {
    let result: Domain.Contexts.User.VendorUser.VendorUser<VendorUserDomainAdapter>;
    When('I call getByExternalId with externalId "123e4567-e89b-12d3-a456-426614174001"', async () => {
      result = await repo.getByExternalId('123e4567-e89b-12d3-a456-426614174001');
    });
    Then('it should return the VendorUser domain object', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.User.VendorUser.VendorUser);
    });
    And('the domain object\'s externalId should be "123e4567-e89b-12d3-a456-426614174001"', () => {
      expect(result.externalId).toBe('123e4567-e89b-12d3-a456-426614174001');
    });
  });

  Scenario('Deleting a VendorUser by ID', ({ When, Then }) => {
    When('I call delete with ID "507f1f77bcf86cd799439011"', async () => {
      await repo.delete('507f1f77bcf86cd799439011');
    });
    Then('the VendorUser document should be deleted from the database', () => {
      expect(findByIdAndDeleteMock).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  Scenario('Creating a new VendorUser instance', ({ When, Then, And }) => {
    let result: Domain.Contexts.User.VendorUser.VendorUser<VendorUserDomainAdapter>;
    When('I call getNewInstance with externalId "123e4567-e89b-12d3-a456-426614174002", lastName "Smith", and restOfName "John"', async () => {
      result = await repo.getNewInstance('123e4567-e89b-12d3-a456-426614174002', 'Smith', 'John');
    });
    Then('it should return a new VendorUser domain object', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.User.VendorUser.VendorUser);
    });
    And('the domain object\'s externalId should be "123e4567-e89b-12d3-a456-426614174002"', () => {
      expect(result.externalId).toBe('123e4567-e89b-12d3-a456-426614174002');
    });
    And('the domain object\'s lastName should be "Smith"', () => {
      expect(result.personalInformation.identityDetails.lastName).toBe('Smith');
    });
    And('the domain object\'s restOfName should be "John"', () => {
      expect(result.personalInformation.identityDetails.restOfName).toBe('John');
    });
  });
});