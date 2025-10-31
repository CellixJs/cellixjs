import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { Domain } from '@ocom/domain';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { StaffRoleRepository } from './staff-role.repository.ts';
import { StaffRoleConverter, type StaffRoleDomainAdapter } from './staff-role.domain-adapter.ts';
import type { DomainSeedwork } from '@cellix/domain-seedwork';
import type { ClientSession } from 'mongoose';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/staff-role.repository.feature')
);

function makeStaffRoleDoc(overrides: Partial<Models.Role.StaffRole> = {}) {
  const base = {
    _id: 'role-1',
    roleName: 'Manager',
    isDefault: false,
    roleType: 'staff',
    permissions: {
      communityPermissions: {
        canManageStaffRolesAndPermissions: false,
        canManageAllCommunities: false,
        canDeleteCommunities: false,
        canChangeCommunityOwner: false,
        canReIndexSearchCollections: false,
      },
      propertyPermissions: {
        canManageProperties: false,
        canEditOwnProperty: false,
      },
      servicePermissions: {
        canManageServices: false,
      },
      serviceTicketPermissions: {
        canCreateTickets: false,
        canManageTickets: false,
        canAssignTickets: false,
        canWorkOnTickets: false,
      },
      violationTicketPermissions: {
        canCreateTickets: false,
        canManageTickets: false,
        canAssignTickets: false,
        canWorkOnTickets: false,
      },
    },
    set(key: keyof Models.Role.StaffRole, value: unknown) {
      (this as Models.Role.StaffRole)[key] = value as never;
    },
    ...overrides,
  } as Models.Role.StaffRole;
  return vi.mocked(base);
}

function makeMockPassport() {
  return {
    user: {
      forStaffRole: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Domain.Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let repo: StaffRoleRepository;
  let converter: StaffRoleConverter;
  let passport: Domain.Passport;
  let staffRoleDoc: Models.Role.StaffRole;
  let eventBus: DomainSeedwork.EventBus;
  let session: ClientSession;

  BeforeEachScenario(() => {
    staffRoleDoc = makeStaffRoleDoc();
    converter = new StaffRoleConverter();
    passport = makeMockPassport();

    // Mock the Mongoose model as a constructor function with static methods
    const ModelMock = function (this: Models.Role.StaffRole) {
      Object.assign(this, makeStaffRoleDoc());
    }
    Object.assign(ModelMock, {
      findById: vi.fn((id: string) => ({
        exec: vi.fn(async () => (id === staffRoleDoc._id ? staffRoleDoc : null)),
      })),
      findOne: vi.fn((query: { roleName: string }) => ({
        exec: vi.fn(async () => (query.roleName === staffRoleDoc.roleName ? staffRoleDoc : null)),
      })),
      prototype: {},
    });

    eventBus = { publish: vi.fn() } as unknown as DomainSeedwork.EventBus;
    session = { startTransaction: vi.fn(), endSession: vi.fn() } as unknown as ClientSession;

    repo = new StaffRoleRepository(
      passport,
      ModelMock as unknown as Models.Role.StaffRoleModelType,
      converter,
      eventBus,
      session
    );
  });

  Background(({ Given, And }) => {
    Given(
      'a StaffRoleRepository instance with a working Mongoose model, type converter, and passport',
      () => {
        // Already set up in BeforeEachScenario
      }
    );
    And(
      'a valid Mongoose StaffRole document with id "role-1", roleName "Manager", isDefault false, and roleType "staff"',
      () => {
        staffRoleDoc = makeStaffRoleDoc();
      }
    );
  });

  Scenario('Getting a staff role by id', ({ When, Then, And }) => {
    let result: Domain.Contexts.User.StaffRole.StaffRole<StaffRoleDomainAdapter>;
    When('I call getById with "role-1"', async () => {
      result = await repo.getById('role-1');
    });
    Then('I should receive a StaffRole domain object', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.User.StaffRole.StaffRole);
    });
    And('the domain object\'s roleName should be "Manager"', () => {
      expect(result.roleName).toBe('Manager');
    });
    And('the domain object\'s isDefault should be false', () => {
      expect(result.isDefault).toBe(false);
    });
    And('the domain object\'s roleType should be "staff"', () => {
      expect(result.roleType).toBe('staff');
    });
  });

  Scenario('Getting a staff role by id that does not exist', ({ When, Then }) => {
    let getById: () => Promise<unknown>;
    When('I call getById with "nonexistent-id"', () => {
      getById = async () => await repo.getById('nonexistent-id');
    });
    Then('an error should be thrown indicating "StaffRole with id nonexistent-id not found"', async () => {
      await expect(getById).rejects.toThrow();
      await expect(getById).rejects.toThrow(/StaffRole with id nonexistent-id not found/);
    });
  });

  Scenario('Getting a staff role by roleName', ({ When, Then, And }) => {
    let result: Domain.Contexts.User.StaffRole.StaffRole<StaffRoleDomainAdapter>;
    When('I call getByRoleName with "Manager"', async () => {
      result = await repo.getByRoleName('Manager');
    });
    Then('I should receive a StaffRole domain object', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.User.StaffRole.StaffRole);
    });
    And('the domain object\'s roleName should be "Manager"', () => {
      expect(result.roleName).toBe('Manager');
    });
    And('the domain object\'s isDefault should be false', () => {
      expect(result.isDefault).toBe(false);
    });
    And('the domain object\'s roleType should be "staff"', () => {
      expect(result.roleType).toBe('staff');
    });
  });

  Scenario('Getting a staff role by roleName that does not exist', ({ When, Then }) => {
    let getByRoleName: () => Promise<unknown>;
    When('I call getByRoleName with "nonexistent-role"', () => {
      getByRoleName = async () => await repo.getByRoleName('nonexistent-role');
    });
    Then('an error should be thrown indicating "StaffRole with roleName nonexistent-role not found"', async () => {
      await expect(getByRoleName).rejects.toThrow();
      await expect(getByRoleName).rejects.toThrow(/StaffRole with roleName nonexistent-role not found/);
    });
  });

  Scenario('Creating a new staff role instance', ({ When, Then, And }) => {
    let result: Domain.Contexts.User.StaffRole.StaffRole<StaffRoleDomainAdapter>;
    When('I call getNewInstance with name "Supervisor"', async () => {
      result = await repo.getNewInstance('Supervisor');
    });
    Then('I should receive a new StaffRole domain object', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.User.StaffRole.StaffRole);
    });
    And('the domain object\'s roleName should be "Supervisor"', () => {
      expect(result.roleName).toBe('Supervisor');
    });
    And('the domain object\'s isDefault should be false', () => {
      expect(result.isDefault).toBe(false);
    });
    And('the domain object\'s roleType should be "staff"', () => {
      expect(result.roleType).toBe('staff');
    });
  });
});