import type { EventBus } from '@cellix/domain-seedwork/event-bus';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';

import { Domain } from '@ocom/domain';
import type { ClientSession } from 'mongoose';
import { expect, vi } from 'vitest';
import { EndUserRoleConverter, type EndUserRoleDomainAdapter } from './end-user-role.domain-adapter.ts';
import { EndUserRoleRepository } from './end-user-role.repository.ts';
import type { Community } from '@ocom/data-sources-mongoose-models/community';
import type { EndUserRole, EndUserRoleModelType } from '@ocom/data-sources-mongoose-models/role/end-user-role';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/end-user-role.repository.feature')
);

function makeEndUserRoleDoc(overrides: Partial<EndUserRole> = {}) {
  const base = {
    id: '507f1f77bcf86cd799439011',
    roleName: 'Test Role',
    isDefault: true,
    community: undefined,
    permissions: {
      communityPermissions: {
        canManageRolesAndPermissions: true,
        canManageCommunitySettings: true,
        canManageSiteContent: true,
        canManageMembers: true,
        canEditOwnMemberProfile: true,
        canEditOwnMemberAccounts: true,
      },
      propertyPermissions: {
        canManageProperties: true,
        canEditOwnProperty: true,
      },
      servicePermissions: {
        canManageServices: true,
      },
      serviceTicketPermissions: {
        canCreateTickets: true,
        canManageTickets: true,
        canAssignTickets: true,
        canWorkOnTickets: true,
      },
      violationTicketPermissions: {
        canCreateTickets: true,
        canManageTickets: true,
        canAssignTickets: true,
        canWorkOnTickets: true,
      },
    },
    set(key: keyof EndUserRole, value: unknown) {
      // Type-safe property assignment
      // biome-ignore lint/plugin/no-type-assertion: test file
      (this as EndUserRole)[key] = value as never;
    },
    ...overrides,
  // biome-ignore lint/plugin/no-type-assertion: test file
  } as EndUserRole;
  return vi.mocked(base);
}

function makeCommunityDoc(overrides: Partial<Community> = {}) {
  const base = {
    id: '6898b0c34b4a2fbc01e9c697',
    name: 'Test Community',
    domain: 'test.com',
    ...overrides,
  // biome-ignore lint/plugin/no-type-assertion: test file
  } as Community;
  return vi.mocked(base);
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
  // biome-ignore lint/plugin/no-type-assertion: test file
  } as unknown as Domain.Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let model: EndUserRoleModelType;
  let converter: EndUserRoleConverter;
  let repository: EndUserRoleRepository;
  let passport: Domain.Passport;
  let communityDoc: Community;
  let result: unknown;

  BeforeEachScenario(() => {
    communityDoc = makeCommunityDoc();
    const endUserRoleDoc = makeEndUserRoleDoc({ community: communityDoc });

    // Mock the Mongoose model as a constructor function with static methods
    const ModelMock = function (this: EndUserRole) {
      Object.assign(this, makeEndUserRoleDoc());
    };
    // Attach static methods to the constructor
    Object.assign(ModelMock, {
      findById: vi.fn((id: string) => ({
        exec: vi.fn(async () => (id === '507f1f77bcf86cd799439011' ? endUserRoleDoc : null)),
      })),
      find: vi.fn(() => ({
        exec: vi.fn(async () => [endUserRoleDoc]),
      })),
      create: vi.fn().mockResolvedValue(endUserRoleDoc),
    });

    // Provide minimal eventBus and session mocks
    // biome-ignore lint/plugin/no-type-assertion: test file
    const eventBus = { publish: vi.fn() } as unknown as EventBus;
    // biome-ignore lint/plugin/no-type-assertion: test file
    const session = { startTransaction: vi.fn(), endSession: vi.fn() } as unknown as ClientSession;

    // biome-ignore lint/plugin/no-type-assertion: test file
    model = ModelMock as unknown as EndUserRoleModelType;
    converter = new EndUserRoleConverter();
    passport = makeMockPassport();

    // Create repository with correct constructor parameters
    repository = new EndUserRoleRepository(
      passport,
      model,
      converter,
      eventBus,
      session
    );
    result = undefined;
  });

  Background(({ Given, And }) => {
    Given(
      'an EndUserRoleRepository instance with a working Mongoose model, type converter, and passport',
      () => {
        // Setup is done in BeforeEachScenario
      }
    );
    And(
      'a valid Mongoose EndUserRole document with id "507f1f77bcf86cd799439011", roleName "Test Role", and a populated community field',
      () => {
        // Setup is done in BeforeEachScenario
      }
    );
  });

  Scenario('Getting an end user role by id', ({ When, Then, And }) => {
    When('I call getById with "507f1f77bcf86cd799439011"', async () => {
      result = await repository.getById('507f1f77bcf86cd799439011');
    });
    Then('I should receive an EndUserRole domain object', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.Community.Role.EndUserRole.EndUserRole);
    });
    And('the domain object\'s roleName should be "Test Role"', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      expect((result as Domain.Contexts.Community.Role.EndUserRole.EndUserRole<EndUserRoleDomainAdapter>).roleName).toBe('Test Role');
    });
  });

  Scenario('Getting an end user role by id that does not exist', ({ When, Then }) => {
    let getByIdError: () => Promise<void>;
    When('I call getById with "nonexistent-id"', () => {
      getByIdError = async () => {
        await repository.getById('nonexistent-id');
      };
    });
    Then('an error should be thrown indicating "EndUserRole with id nonexistent-id not found"', async () => {
      await expect(getByIdError()).rejects.toThrow('EndUserRole with id nonexistent-id not found');
    });
  });

  Scenario('Creating a new end user role instance', ({ Given, When, Then, And }) => {
    let communityDomainObj: Domain.Contexts.Community.Community.CommunityEntityReference;

    // biome-ignore lint/plugin/no-type-assertion: test file
    Given('a valid Community domain object as the community', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      communityDomainObj = { id: communityDoc.id.toString(), name: 'Test Community' } as Domain.Contexts.Community.Community.CommunityEntityReference;
    });
    When('I call getNewInstance with roleName "New Role", isDefault false, and the community', async () => {
      result = await repository.getNewInstance('New Role', false, communityDomainObj);
    });
    Then('I should receive a new EndUserRole domain object', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.Community.Role.EndUserRole.EndUserRole);
    });
    And('the domain object\'s roleName should be "New Role"', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      expect((result as Domain.Contexts.Community.Role.EndUserRole.EndUserRole<EndUserRoleDomainAdapter>).roleName).toBe('New Role');
    });
    And('the domain object\'s isDefault should be false', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      expect((result as Domain.Contexts.Community.Role.EndUserRole.EndUserRole<EndUserRoleDomainAdapter>).isDefault).toBe(false);
    });
  });

  Scenario('Creating a new end user role instance with an invalid community', ({ Given, When, Then }) => {
    let getNewInstanceError: () => Promise<void>;
    let invalidCommunity: Domain.Contexts.Community.Community.CommunityEntityReference;

    Given('an invalid community object', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      invalidCommunity = { id: '' } as Domain.Contexts.Community.Community.CommunityEntityReference;
    });
    When('I call getNewInstance with roleName "Invalid Role", isDefault true, and the invalid community', () => {
      getNewInstanceError = async () => {
        await repository.getNewInstance('Invalid Role', true, invalidCommunity);
      };
    });
    Then('an error should be thrown indicating the community is not valid', async () => {
      await expect(getNewInstanceError()).rejects.toThrow();
    });
  });
});