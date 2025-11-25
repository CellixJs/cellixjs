import type { EventBus } from '@cellix/domain-seedwork/event-bus';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { Passport } from '@ocom/domain';

import { CommunityRepository } from './community.repository.ts';
import { CommunityConverter, type CommunityDomainAdapter } from './community.domain-adapter.ts';
import { EndUserDomainAdapter } from '../../user/end-user/end-user.domain-adapter.ts';
import type { ClientSession } from 'mongoose';
import type { Community, CommunityModelType } from '@ocom/data-sources-mongoose-models/community';
import type { EndUser } from '@ocom/data-sources-mongoose-models/user/end-user';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/community.repository.feature')
);

function makeCommunityDoc(overrides: Partial<Community> = {}) {
  const base = {
    id: 'community-1',
    name: 'Test Community',
    domain: 'test.com',
    whiteLabelDomain: 'white.test.com',
    handle: 'test-handle',
    createdBy: undefined,
    set(key: keyof Community, value: unknown) {
      (this as Community)[key] = value as never;
    },
    ...overrides,
  } as Community;
  return vi.mocked(base);
}

function makeUserDoc(overrides: Partial<EndUser> = {}) {
  return { id: 'user-1', displayName: 'Test User', ...overrides } as EndUser;
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
  let repo: CommunityRepository;
  let converter: CommunityConverter;
  let passport: Passport;
  let userDoc: EndUser;
  let userAdapter: EndUserDomainAdapter;
  let communityDoc: Community;
  let result: Community<CommunityDomainAdapter>;

  BeforeEachScenario(() => {
    userDoc = makeUserDoc();
    userAdapter = new EndUserDomainAdapter(userDoc);
    communityDoc = makeCommunityDoc({ _id: 'community-1', createdBy: userDoc });
    converter = new CommunityConverter();
    passport = makeMockPassport();
    result = {} as Community<CommunityDomainAdapter>;
    // Mock the Mongoose model as a constructor function with static methods
    const ModelMock = function (this: Community) {
      Object.assign(this, makeCommunityDoc());
    }
    // Attach static methods to the constructor
    Object.assign(ModelMock, {
      findById: vi.fn((id: string) => ({
        populate: vi.fn(() => ({
          exec: vi.fn(async () => (id === 'community-1' ? communityDoc : null)),
        })),
      })),
    });

    // Provide minimal eventBus and session mocks
    const eventBus = { publish: vi.fn() } as unknown as EventBus;
    const session = { startTransaction: vi.fn(), endSession: vi.fn() } as unknown as ClientSession;

    repo = new CommunityRepository(
      passport,
      ModelMock as unknown as CommunityModelType,
      converter,
      eventBus,
      session
    );   
  });

  Background(({ Given, And }) => {
    Given(
      'a CommunityRepository instance with a working Mongoose model, type converter, and passport',
      () => {
        // This is set up in BeforeEachScenario
      }
    );
    And(
      'a valid Mongoose Community document with id "community-1", name "Test Community", and a populated createdBy field',
      () => {
        userDoc = makeUserDoc();
        communityDoc = makeCommunityDoc({ _id: 'community-1', name: 'Test Community', createdBy: userDoc });
      }
    );
  });

  Scenario('Getting a community by id with createdBy populated', ({ When, Then, And }) => {
    When('I call getByIdWithCreatedBy with "community-1"', async () => {
      result = await repo.getByIdWithCreatedBy('community-1');
    });
    Then('I should receive a Community domain object', () => {
      expect(result).toBeInstanceOf(Community);
    });
    And('the domain object\'s name should be "Test Community"', () => {
      expect(result.name).toBe('Test Community');
    });
    And('the domain object\'s createdBy should be an EndUser domain object with the correct user data', () => {
      const { createdBy } = result as Community<CommunityDomainAdapter>;
      expect(createdBy).toBeInstanceOf(EndUser);
      expect(createdBy.id).toBe(userDoc.id);
      expect(createdBy.displayName).toBe(userDoc.displayName);
    });
  });

  Scenario('Getting a community by id that does not exist', ({ When, Then }) => {
    let gettingCommunityThatDoesNotExist: () => Promise<Community<CommunityDomainAdapter>>;
    When('I call getByIdWithCreatedBy with "nonexistent-id"', () => {
      gettingCommunityThatDoesNotExist = async () => await repo.getByIdWithCreatedBy('nonexistent-id');
    });
    Then('an error should be thrown indicating "Community with id nonexistent-id not found"', async () => {
      await expect(gettingCommunityThatDoesNotExist).rejects.toThrow();
      await expect(gettingCommunityThatDoesNotExist).rejects.toThrow(/Community with id nonexistent-id not found/);
    });
  });

  Scenario('Creating a new community instance', ({ Given, When, Then, And }) => {
    let userDomainObject: EndUser<EndUserDomainAdapter>;
    Given('a valid EndUser domain object as the user', () => {
      userDoc = makeUserDoc();
      userAdapter = new EndUserDomainAdapter(userDoc)
      userDomainObject = new EndUser(userAdapter, passport);
    });
    When('I call getNewInstance with name "New Community" and the user', async () => {
      result = await repo.getNewInstance('New Community', userDomainObject);
    });
    Then('I should receive a new Community domain object', () => {
      expect(result).toBeInstanceOf(Community);
    });
    And('the domain object\'s name should be "New Community"', () => {
      expect(result.name).toBe('New Community');
    });
    And('the domain object\'s createdBy should be the given user', () => {
      const { createdBy } = result;
      expect(createdBy).toBeInstanceOf(EndUser);
      expect(createdBy.id).toBe(userDoc.id);
      expect(createdBy.displayName).toBe(userDoc.displayName);
    });
  });

  Scenario('Creating a new community instance with an invalid user', ({ Given, When, Then }) => {
    let getNewInstanceWithInvalidUser: () => Promise<unknown>;
    let invalidUser: unknown;
    Given('an invalid user object', () => {
      invalidUser = {};
    });
    When('I call getNewInstance with name "Invalid Community" and the invalid user', () => {
      getNewInstanceWithInvalidUser = () => repo.getNewInstance('Invalid Community', invalidUser as EndUserEntityReference);
    });
    Then('an error should be thrown indicating the user is not valid', async () => {
      await expect(getNewInstanceWithInvalidUser).rejects.toThrow();
      await expect(getNewInstanceWithInvalidUser).rejects.toThrow(/user reference is missing id/);
    });
  });
});