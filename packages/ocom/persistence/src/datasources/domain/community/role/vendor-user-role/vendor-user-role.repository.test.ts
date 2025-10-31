import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { DomainSeedwork } from '@cellix/domain-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { Domain } from '@ocom/domain';
import type { ClientSession } from 'mongoose';
import { expect, vi } from 'vitest';
import { VendorUserRoleConverter, type VendorUserRoleDomainAdapter } from './vendor-user-role.domain-adapter.ts';
import { VendorUserRoleRepository } from './vendor-user-role.repository.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/vendor-user-role.repository.feature')
);

function makeVendorUserRoleDoc(overrides: Partial<Models.Role.VendorUserRole> = {}) {
  const base = {
    id: '507f1f77bcf86cd799439011',
    roleName: 'Test Vendor Role',
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
    set(key: keyof Models.Role.VendorUserRole, value: unknown) {
      // Type-safe property assignment
      (this as Models.Role.VendorUserRole)[key] = value as never;
    },
    ...overrides,
  } as Models.Role.VendorUserRole;
  return vi.mocked(base);
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
    user: {
      forVendorUser: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Domain.Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let model: Models.Role.VendorUserRoleModelType;
  let converter: VendorUserRoleConverter;
  let repository: VendorUserRoleRepository;
  let passport: Domain.Passport;
  let communityDoc: Models.Community.Community;
  let result: unknown;

  BeforeEachScenario(() => {
    communityDoc = makeCommunityDoc();
    const vendorUserRoleDoc = makeVendorUserRoleDoc({ community: communityDoc });

    // Mock the Mongoose model as a constructor function with static methods
    const ModelMock = function (this: Models.Role.VendorUserRole) {
      Object.assign(this, makeVendorUserRoleDoc());
    };
    // Attach static methods to the constructor
    Object.assign(ModelMock, {
      findById: vi.fn((id: string) => ({
        exec: vi.fn(async () => (id === '507f1f77bcf86cd799439011' ? vendorUserRoleDoc : null)),
      })),
      find: vi.fn(() => ({
        exec: vi.fn(async () => [vendorUserRoleDoc]),
      })),
      create: vi.fn().mockResolvedValue(vendorUserRoleDoc),
    });

    // Provide minimal eventBus and session mocks
    const eventBus = { publish: vi.fn() } as unknown as DomainSeedwork.EventBus;
    const session = { startTransaction: vi.fn(), endSession: vi.fn() } as unknown as ClientSession;

    model = ModelMock as unknown as Models.Role.VendorUserRoleModelType;
    converter = new VendorUserRoleConverter();
    passport = makeMockPassport();

    // Create repository with correct constructor parameters
    repository = new VendorUserRoleRepository(
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
      'a VendorUserRoleRepository instance with a working Mongoose model, type converter, and passport',
      () => {
        // Setup is done in BeforeEachScenario
      }
    );
    And(
      'a valid Mongoose VendorUserRole document with id "507f1f77bcf86cd799439011", roleName "Test Vendor Role", and a populated community field',
      () => {
        // Setup is done in BeforeEachScenario
      }
    );
  });

  Scenario('Getting a vendor user role by id', ({ When, Then, And }) => {
    When('I call getById with "507f1f77bcf86cd799439011"', async () => {
      result = await repository.getById('507f1f77bcf86cd799439011');
    });
    Then('I should receive a VendorUserRole domain object', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.Community.Role.VendorUserRole.VendorUserRole);
    });
    And('the domain object\'s roleName should be "Test Vendor Role"', () => {
      expect((result as Domain.Contexts.Community.Role.VendorUserRole.VendorUserRole<VendorUserRoleDomainAdapter>).roleName).toBe('Test Vendor Role');
    });
  });

  Scenario('Getting a vendor user role by id that does not exist', ({ When, Then }) => {
    let getByIdError: () => Promise<void>;
    When('I call getById with "nonexistent-id"', () => {
      getByIdError = async () => {
        await repository.getById('nonexistent-id');
      };
    });
    Then('an error should be thrown indicating "VendorUserRole with id nonexistent-id not found"', async () => {
      await expect(getByIdError()).rejects.toThrow('VendorUserRole with id nonexistent-id not found');
    });
  });

  Scenario('Creating a new vendor user role instance', ({ Given, When, Then, And }) => {
    let communityDomainObj: Domain.Contexts.Community.Community.CommunityEntityReference;

    Given('a valid Community domain object as the community', () => {
      communityDomainObj = { id: communityDoc.id.toString(), name: 'Test Community' } as Domain.Contexts.Community.Community.CommunityEntityReference;
    });
    When('I call getNewInstance with roleName "New Vendor Role", isDefault false, and the community', async () => {
      result = await repository.getNewInstance('New Vendor Role', false, communityDomainObj);
    });
    Then('I should receive a new VendorUserRole domain object', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.Community.Role.VendorUserRole.VendorUserRole);
    });
    And('the domain object\'s roleName should be "New Vendor Role"', () => {
      expect((result as Domain.Contexts.Community.Role.VendorUserRole.VendorUserRole<VendorUserRoleDomainAdapter>).roleName).toBe('New Vendor Role');
    });
    And('the domain object\'s isDefault should be false', () => {
      expect((result as Domain.Contexts.Community.Role.VendorUserRole.VendorUserRole<VendorUserRoleDomainAdapter>).isDefault).toBe(false);
    });
  });
});