import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { Domain } from '@ocom/domain';
import type { StaffRole } from '@ocom/data-sources-mongoose-models/role/staff-role';


const test = { for: describeFeature };
import {
  StaffRoleConverter,
  StaffRoleDomainAdapter,
  StaffRolePermissionsAdapter,
  StaffRoleCommunityPermissionsAdapter,
  StaffRolePropertyPermissionsAdapter,
  StaffRoleServicePermissionsAdapter,
  StaffRoleServiceTicketPermissionsAdapter,
  StaffRoleViolationTicketPermissionsAdapter,
} from './staff-role.domain-adapter.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const domainAdapterFeature = await loadFeature(
  path.resolve(__dirname, 'features/staff-role.domain-adapter.feature')
);
const typeConverterFeature = await loadFeature(
  path.resolve(__dirname, 'features/staff-role.type-converter.feature')
);

function makeStaffRoleDoc(overrides: Partial<StaffRole> = {}) {
  const base = {
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
    ...overrides,
  // biome-ignore lint/plugin/no-type-assertion: test file
  } as StaffRole;
  return vi.mocked(base);
}

function makeMockPassport() {
  return {
    user: {
      forStaffRole: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  // biome-ignore lint/plugin/no-type-assertion: test file
  } as unknown as Domain.Passport;
}

test.for(domainAdapterFeature, ({ Scenario, Background, BeforeEachScenario }) => {
  let doc: StaffRole;
  let adapter: StaffRoleDomainAdapter;
  let result: unknown;

  BeforeEachScenario(() => {
    doc = makeStaffRoleDoc();
    adapter = new StaffRoleDomainAdapter(doc);
    result = undefined;
  });

  Background(({ Given }) => {
    Given(
      'a valid Mongoose StaffRole document with roleName "Manager", isDefault false, and roleType "staff"',
      () => {
        doc = makeStaffRoleDoc();
        adapter = new StaffRoleDomainAdapter(doc);
      }
    );
  });

  Scenario('Getting the roleName property', ({ Given, When, Then }) => {
    Given('a StaffRoleDomainAdapter for the document', () => {
      adapter = new StaffRoleDomainAdapter(doc);
    });
    When('I get the roleName property', () => {
      result = adapter.roleName;
    });
    Then('it should return "Manager"', () => {
      expect(result).toBe('Manager');
    });
  });

  Scenario('Getting and setting the roleName property', ({ Given, When, Then }) => {
    Given('a StaffRoleDomainAdapter for the document', () => {
      adapter = new StaffRoleDomainAdapter(doc);
    });
    When('I set the roleName property to "Supervisor"', () => {
      adapter.roleName = 'Supervisor';
    });
    Then('the document\'s roleName should be "Supervisor"', () => {
      expect(doc.roleName).toBe('Supervisor');
    });
  });

  Scenario('Getting the isDefault property', ({ Given, When, Then }) => {
    Given('a StaffRoleDomainAdapter for the document', () => {
      adapter = new StaffRoleDomainAdapter(doc);
    });
    When('I get the isDefault property', () => {
      result = adapter.isDefault;
    });
    Then('it should return false', () => {
      expect(result).toBe(false);
    });
  });

  Scenario('Getting and setting the isDefault property', ({ Given, When, Then }) => {
    Given('a StaffRoleDomainAdapter for the document', () => {
      adapter = new StaffRoleDomainAdapter(doc);
    });
    When('I set the isDefault property to true', () => {
      adapter.isDefault = true;
    });
    Then('the document\'s isDefault should be true', () => {
      expect(doc.isDefault).toBe(true);
    });
  });

  Scenario('Getting the roleType property', ({ Given, When, Then }) => {
    Given('a StaffRoleDomainAdapter for the document', () => {
      adapter = new StaffRoleDomainAdapter(doc);
    });
    When('I get the roleType property', () => {
      result = adapter.roleType;
    });
    Then('it should return "staff"', () => {
      expect(result).toBe('staff');
    });
  });

  Scenario('Getting the permissions property', ({ Given, When, Then }) => {
    Given('a StaffRoleDomainAdapter for the document', () => {
      adapter = new StaffRoleDomainAdapter(doc);
    });
    When('I get the permissions property', () => {
      result = adapter.permissions;
    });
    Then('it should return a StaffRolePermissionsAdapter instance', () => {
      expect(result).toBeInstanceOf(StaffRolePermissionsAdapter);
    });
  });

  Scenario('Getting communityPermissions from permissions', ({ Given, When, And, Then }) => {
    let permissions: StaffRolePermissionsAdapter;
    Given('a StaffRoleDomainAdapter for the document', () => {
      adapter = new StaffRoleDomainAdapter(doc);
    });
    When('I get the permissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      permissions = adapter.permissions as StaffRolePermissionsAdapter;
    });
    And('I get the communityPermissions property', () => {
      result = permissions.communityPermissions;
    });
    Then('it should return a StaffRoleCommunityPermissionsAdapter instance', () => {
      expect(result).toBeInstanceOf(StaffRoleCommunityPermissionsAdapter);
    });
  });

  Scenario('Getting and setting canManageStaffRolesAndPermissions from communityPermissions', ({ Given, When, And, Then }) => {
    let permissions: StaffRolePermissionsAdapter;
    let communityPermissions: StaffRoleCommunityPermissionsAdapter;
    Given('a StaffRoleDomainAdapter for the document', () => {
      adapter = new StaffRoleDomainAdapter(doc);
    });
    When('I get the permissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      permissions = adapter.permissions as StaffRolePermissionsAdapter;
    });
    And('I get the communityPermissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      communityPermissions = permissions.communityPermissions as StaffRoleCommunityPermissionsAdapter;
    });
    And('I get the canManageStaffRolesAndPermissions property', () => {
      result = communityPermissions.canManageStaffRolesAndPermissions;
    });
    Then('it should return false', () => {
      expect(result).toBe(false);
    });
    When('I set the canManageStaffRolesAndPermissions property to true', () => {
      communityPermissions.canManageStaffRolesAndPermissions = true;
    });
    Then('the communityPermissions\' canManageStaffRolesAndPermissions should be true', () => {
      expect(doc.permissions?.communityPermissions?.canManageStaffRolesAndPermissions).toBe(true);
    });
  });

  Scenario('Getting and setting canManageAllCommunities from communityPermissions', ({ Given, When, And, Then }) => {
    let permissions: StaffRolePermissionsAdapter;
    let communityPermissions: StaffRoleCommunityPermissionsAdapter;
    Given('a StaffRoleDomainAdapter for the document', () => {
      adapter = new StaffRoleDomainAdapter(doc);
    });
    When('I get the permissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      permissions = adapter.permissions as StaffRolePermissionsAdapter;
    });
    And('I get the communityPermissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      communityPermissions = permissions.communityPermissions as StaffRoleCommunityPermissionsAdapter;
    });
    And('I get the canManageAllCommunities property', () => {
      result = communityPermissions.canManageAllCommunities;
    });
    Then('it should return false', () => {
      expect(result).toBe(false);
    });
    When('I set the canManageAllCommunities property to true', () => {
      communityPermissions.canManageAllCommunities = true;
    });
    Then('the communityPermissions\' canManageAllCommunities should be true', () => {
      expect(doc.permissions?.communityPermissions?.canManageAllCommunities).toBe(true);
    });
  });

  Scenario('Getting and setting canDeleteCommunities from communityPermissions', ({ Given, When, And, Then }) => {
    let permissions: StaffRolePermissionsAdapter;
    let communityPermissions: StaffRoleCommunityPermissionsAdapter;
    Given('a StaffRoleDomainAdapter for the document', () => {
      adapter = new StaffRoleDomainAdapter(doc);
    });
    When('I get the permissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      permissions = adapter.permissions as StaffRolePermissionsAdapter;
    });
    And('I get the communityPermissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      communityPermissions = permissions.communityPermissions as StaffRoleCommunityPermissionsAdapter;
    });
    And('I get the canDeleteCommunities property', () => {
      result = communityPermissions.canDeleteCommunities;
    });
    Then('it should return false', () => {
      expect(result).toBe(false);
    });
    When('I set the canDeleteCommunities property to true', () => {
      communityPermissions.canDeleteCommunities = true;
    });
    Then('the communityPermissions\' canDeleteCommunities should be true', () => {
      expect(doc.permissions?.communityPermissions?.canDeleteCommunities).toBe(true);
    });
  });

  Scenario('Getting and setting canChangeCommunityOwner from communityPermissions', ({ Given, When, And, Then }) => {
    let permissions: StaffRolePermissionsAdapter;
    let communityPermissions: StaffRoleCommunityPermissionsAdapter;
    Given('a StaffRoleDomainAdapter for the document', () => {
      adapter = new StaffRoleDomainAdapter(doc);
    });
    When('I get the permissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      permissions = adapter.permissions as StaffRolePermissionsAdapter;
    });
    And('I get the communityPermissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      communityPermissions = permissions.communityPermissions as StaffRoleCommunityPermissionsAdapter;
    });
    And('I get the canChangeCommunityOwner property', () => {
      result = communityPermissions.canChangeCommunityOwner;
    });
    Then('it should return false', () => {
      expect(result).toBe(false);
    });
    When('I set the canChangeCommunityOwner property to true', () => {
      communityPermissions.canChangeCommunityOwner = true;
    });
    Then('the communityPermissions\' canChangeCommunityOwner should be true', () => {
      expect(doc.permissions?.communityPermissions?.canChangeCommunityOwner).toBe(true);
    });
  });

  Scenario('Getting and setting canReIndexSearchCollections from communityPermissions', ({ Given, When, And, Then }) => {
    let permissions: StaffRolePermissionsAdapter;
    let communityPermissions: StaffRoleCommunityPermissionsAdapter;
    Given('a StaffRoleDomainAdapter for the document', () => {
      adapter = new StaffRoleDomainAdapter(doc);
    });
    When('I get the permissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      permissions = adapter.permissions as StaffRolePermissionsAdapter;
    });
    And('I get the communityPermissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      communityPermissions = permissions.communityPermissions as StaffRoleCommunityPermissionsAdapter;
    });
    And('I get the canReIndexSearchCollections property', () => {
      result = communityPermissions.canReIndexSearchCollections;
    });
    Then('it should return false', () => {
      expect(result).toBe(false);
    });
    When('I set the canReIndexSearchCollections property to true', () => {
      communityPermissions.canReIndexSearchCollections = true;
    });
    Then('the communityPermissions\' canReIndexSearchCollections should be true', () => {
      expect(doc.permissions?.communityPermissions?.canReIndexSearchCollections).toBe(true);
    });
  });

  Scenario('Getting propertyPermissions from permissions', ({ Given, When, And, Then }) => {
    let permissions: StaffRolePermissionsAdapter;
    Given('a StaffRoleDomainAdapter for the document', () => {
      adapter = new StaffRoleDomainAdapter(doc);
    });
    When('I get the permissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      permissions = adapter.permissions as StaffRolePermissionsAdapter;
    });
    And('I get the propertyPermissions property', () => {
      result = permissions.propertyPermissions;
    });
    Then('it should return a StaffRolePropertyPermissionsAdapter instance', () => {
      expect(result).toBeInstanceOf(StaffRolePropertyPermissionsAdapter);
    });
  });

  Scenario('Getting and setting canManageProperties from propertyPermissions', ({ Given, When, And, Then }) => {
    let permissions: StaffRolePermissionsAdapter;
    let propertyPermissions: StaffRolePropertyPermissionsAdapter;
    Given('a StaffRoleDomainAdapter for the document', () => {
      adapter = new StaffRoleDomainAdapter(doc);
    });
    When('I get the permissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      permissions = adapter.permissions as StaffRolePermissionsAdapter;
    });
    And('I get the propertyPermissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      propertyPermissions = permissions.propertyPermissions as StaffRolePropertyPermissionsAdapter;
    });
    And('I get the canManageProperties property', () => {
      result = propertyPermissions.canManageProperties;
    });
    Then('it should return false', () => {
      expect(result).toBe(false);
    });
    When('I set the canManageProperties property to true', () => {
      propertyPermissions.canManageProperties = true;
    });
    Then('the propertyPermissions\' canManageProperties should be true', () => {
      expect(doc.permissions?.propertyPermissions?.canManageProperties).toBe(true);
    });
  });

  Scenario('Getting and setting canEditOwnProperty from propertyPermissions', ({ Given, When, And, Then }) => {
    let permissions: StaffRolePermissionsAdapter;
    let propertyPermissions: StaffRolePropertyPermissionsAdapter;
    Given('a StaffRoleDomainAdapter for the document', () => {
      adapter = new StaffRoleDomainAdapter(doc);
    });
    When('I get the permissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      permissions = adapter.permissions as StaffRolePermissionsAdapter;
    });
    And('I get the propertyPermissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      propertyPermissions = permissions.propertyPermissions as StaffRolePropertyPermissionsAdapter;
    });
    And('I get the canEditOwnProperty property', () => {
      result = propertyPermissions.canEditOwnProperty;
    });
    Then('it should return false', () => {
      expect(result).toBe(false);
    });
    When('I set the canEditOwnProperty property to true', () => {
      propertyPermissions.canEditOwnProperty = true;
    });
    Then('the propertyPermissions\' canEditOwnProperty should be true', () => {
      expect(doc.permissions?.propertyPermissions?.canEditOwnProperty).toBe(true);
    });
  });

  Scenario('Getting servicePermissions from permissions', ({ Given, When, And, Then }) => {
    let permissions: StaffRolePermissionsAdapter;
    Given('a StaffRoleDomainAdapter for the document', () => {
      adapter = new StaffRoleDomainAdapter(doc);
    });
    When('I get the permissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      permissions = adapter.permissions as StaffRolePermissionsAdapter;
    });
    And('I get the servicePermissions property', () => {
      result = permissions.servicePermissions;
    });
    Then('it should return a StaffRoleServicePermissionsAdapter instance', () => {
      expect(result).toBeInstanceOf(StaffRoleServicePermissionsAdapter);
    });
  });

  Scenario('Getting canManageServices from servicePermissions', ({ Given, When, And, Then }) => {
    let permissions: StaffRolePermissionsAdapter;
    let servicePermissions: StaffRoleServicePermissionsAdapter;
    Given('a StaffRoleDomainAdapter for the document', () => {
      adapter = new StaffRoleDomainAdapter(doc);
    });
    When('I get the permissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      permissions = adapter.permissions as StaffRolePermissionsAdapter;
    });
    And('I get the servicePermissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      servicePermissions = permissions.servicePermissions as StaffRoleServicePermissionsAdapter;
    });
    And('I get the canManageServices property', () => {
      result = servicePermissions.canManageServices;
    });
    Then('it should return false', () => {
      expect(result).toBe(false);
    });
  });

  Scenario('Getting serviceTicketPermissions from permissions', ({ Given, When, And, Then }) => {
    let permissions: StaffRolePermissionsAdapter;
    Given('a StaffRoleDomainAdapter for the document', () => {
      adapter = new StaffRoleDomainAdapter(doc);
    });
    When('I get the permissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      permissions = adapter.permissions as StaffRolePermissionsAdapter;
    });
    And('I get the serviceTicketPermissions property', () => {
      result = permissions.serviceTicketPermissions;
    });
    Then('it should return a StaffRoleServiceTicketPermissionsAdapter instance', () => {
      expect(result).toBeInstanceOf(StaffRoleServiceTicketPermissionsAdapter);
    });
  });

  Scenario('Getting ticket permissions from serviceTicketPermissions', ({ Given, When, Then, And }) => {
    let permissions: StaffRolePermissionsAdapter;
    let serviceTicketPermissions: StaffRoleServiceTicketPermissionsAdapter;
    Given('a StaffRoleDomainAdapter for the document', () => {
      adapter = new StaffRoleDomainAdapter(doc);
    });
    When('I get the permissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      permissions = adapter.permissions as StaffRolePermissionsAdapter;
    });
    And('I get the serviceTicketPermissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      serviceTicketPermissions = permissions.serviceTicketPermissions as StaffRoleServiceTicketPermissionsAdapter;
    });
    Then('the canCreateTickets property should return false', () => {
      expect(serviceTicketPermissions.canCreateTickets).toBe(false);
    });
    And('the canManageTickets property should return false', () => {
      expect(serviceTicketPermissions.canManageTickets).toBe(false);
    });
    And('the canAssignTickets property should return false', () => {
      expect(serviceTicketPermissions.canAssignTickets).toBe(false);
    });
    And('the canWorkOnTickets property should return false', () => {
      expect(serviceTicketPermissions.canWorkOnTickets).toBe(false);
    });
  });

  Scenario('Getting violationTicketPermissions from permissions', ({ Given, When, And, Then }) => {
    let permissions: StaffRolePermissionsAdapter;
    Given('a StaffRoleDomainAdapter for the document', () => {
      adapter = new StaffRoleDomainAdapter(doc);
    });
    When('I get the permissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      permissions = adapter.permissions as StaffRolePermissionsAdapter;
    });
    And('I get the violationTicketPermissions property', () => {
      result = permissions.violationTicketPermissions;
    });
    Then('it should return a StaffRoleViolationTicketPermissionsAdapter instance', () => {
      expect(result).toBeInstanceOf(StaffRoleViolationTicketPermissionsAdapter);
    });
  });

  Scenario('Getting and setting violation ticket permissions', ({ Given, When, Then, And }) => {
    let permissions: StaffRolePermissionsAdapter;
    let violationTicketPermissions: StaffRoleViolationTicketPermissionsAdapter;
    Given('a StaffRoleDomainAdapter for the document', () => {
      adapter = new StaffRoleDomainAdapter(doc);
    });
    When('I get the permissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      permissions = adapter.permissions as StaffRolePermissionsAdapter;
    });
    And('I get the violationTicketPermissions property', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      violationTicketPermissions = permissions.violationTicketPermissions as StaffRoleViolationTicketPermissionsAdapter;
    });
    Then('the canCreateTickets property should return false', () => {
      expect(violationTicketPermissions.canCreateTickets).toBe(false);
    });
    And('the canManageTickets property should return false', () => {
      expect(violationTicketPermissions.canManageTickets).toBe(false);
    });
    And('the canAssignTickets property should return false', () => {
      expect(violationTicketPermissions.canAssignTickets).toBe(false);
    });
    And('the canWorkOnTickets property should return false', () => {
      expect(violationTicketPermissions.canWorkOnTickets).toBe(false);
    });
    When('I set the canCreateTickets property to true', () => {
      violationTicketPermissions.canCreateTickets = true;
    });
    Then('the violationTicketPermissions\' canCreateTickets should be true', () => {
      expect(doc.permissions?.violationTicketPermissions?.canCreateTickets).toBe(true);
    });
  });
});

test.for(typeConverterFeature, ({ Scenario, Background, BeforeEachScenario }) => {
  let converter: StaffRoleConverter;
  let doc: StaffRole;
  let domainObject: Domain.Contexts.User.StaffRole.StaffRole<StaffRoleDomainAdapter>;
  let result: Domain.Contexts.User.StaffRole.StaffRole<StaffRoleDomainAdapter> | StaffRole | undefined;

  BeforeEachScenario(() => {
    converter = new StaffRoleConverter();
    doc = makeStaffRoleDoc();
    // biome-ignore lint/plugin/no-type-assertion: test file
    domainObject = {} as Domain.Contexts.User.StaffRole.StaffRole<StaffRoleDomainAdapter>;
    result = undefined;
  });

  Background(({ Given }) => {
    Given(
      'a valid Mongoose StaffRole document with roleName "Manager", isDefault false, and roleType "staff"',
      () => {
        doc = makeStaffRoleDoc();
      }
    );
  });

  Scenario('Converting a Mongoose StaffRole document to a domain object', ({ Given, When, Then, And }) => {
    Given('a StaffRoleConverter instance', () => {
      converter = new StaffRoleConverter();
    });
    When('I call toDomain with the Mongoose StaffRole document', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      result = converter.toDomain(doc, makeMockPassport()) as Domain.Contexts.User.StaffRole.StaffRole<StaffRoleDomainAdapter>;
    });
    Then('I should receive a StaffRole domain object', () => {
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Domain.Contexts.User.StaffRole.StaffRole);
    });
    And('the domain object\'s roleName should be "Manager"', () => {
      expect(result?.roleName).toBe('Manager');
    });
    And('the domain object\'s isDefault should be false', () => {
      expect(result?.isDefault).toBe(false);
    });
    And('the domain object\'s roleType should be "staff"', () => {
      expect(result?.roleType).toBe('staff');
    });
  });

  Scenario('Converting a domain object to a Mongoose StaffRole document', ({ Given, When, Then, And }) => {
    Given('a StaffRoleConverter instance', () => {
      converter = new StaffRoleConverter();
    });
    And('a StaffRole domain object with roleName "Supervisor", isDefault true, and roleType "admin"', () => {
      // Create a mock domain object
      const mockAdapter = new StaffRoleDomainAdapter(makeStaffRoleDoc({
        roleName: 'Supervisor',
        isDefault: true,
        roleType: 'admin',
      }));
      domainObject = new Domain.Contexts.User.StaffRole.StaffRole(mockAdapter, makeMockPassport());
    });
    When('I call toPersistence with the StaffRole domain object', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      result = converter.toPersistence(domainObject) as StaffRole;
    });
    Then('I should receive a Mongoose StaffRole document', () => {
      expect(result).toBeDefined();
      expect(result).toHaveProperty('roleName');
      expect(result).toHaveProperty('isDefault');
      expect(result).toHaveProperty('roleType');
    });
    And('the document\'s roleName should be "Supervisor"', () => {
      expect(result?.roleName).toBe('Supervisor');
    });
    And('the document\'s isDefault should be true', () => {
      expect(result?.isDefault).toBe(true);
    });
    And('the document\'s roleType should be "admin"', () => {
      expect(result?.roleType).toBe('admin');
    });
  });
});