import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';

import { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { CommunityDomainAdapter } from '../../community/community.domain-adapter.ts';
import type { Community } from '@ocom/data-sources-mongoose-models/community';
import type { VendorUserRole } from '@ocom/data-sources-mongoose-models/role/vendor-user-role';

const test = { for: describeFeature };
import {
    VendorUserRoleConverter,
    VendorUserRoleDomainAdapter,
    VendorUserRolePermissionsDomainAdapter,
} from './vendor-user-role.domain-adapter.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const domainAdapterFeature = await loadFeature(
  path.resolve(__dirname, 'features/vendor-user-role.domain-adapter.feature')
);
const typeConverterFeature = await loadFeature(
  path.resolve(__dirname, 'features/vendor-user-role.type-converter.feature')
);

function makeVendorUserRoleDoc(overrides: Partial<VendorUserRole> = {}) {
  const base = {
    id: '507f1f77bcf86cd799439011',
    roleName: 'Test Vendor Role',
    isDefault: true,
    roleType: 'vendor-user-role',
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
    set(key: keyof VendorUserRole, value: unknown) {
      (this as VendorUserRole)[key] = value as never;
    },
    ...overrides,
  } as VendorUserRole;
  return vi.mocked(base);
}

function makeCommunityDoc(overrides: Partial<Community> = {}) {
  const base = {
    id: '6898b0c34b4a2fbc01e9c697',
    name: 'Test Community',
    domain: 'test.com',
    ...overrides,
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
  } as unknown as Domain.Passport;
}

test.for(domainAdapterFeature, ({ Scenario, Background, BeforeEachScenario }) => {
  let vendorUserRoleDoc: VendorUserRole;
  let communityDoc: Community;
  let adapter: VendorUserRoleDomainAdapter;
  let result: unknown;

  BeforeEachScenario(() => {
    communityDoc = makeCommunityDoc();
    vendorUserRoleDoc = makeVendorUserRoleDoc({ community: communityDoc });
    adapter = new VendorUserRoleDomainAdapter(vendorUserRoleDoc);
    result = undefined;
  });

  Background(({ Given }) => {
    Given('a VendorUserRole document with populated community', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Accessing roleName property', ({ When, Then }) => {
    When('I access the roleName property', () => {
      result = adapter.roleName;
    });
    Then('I should get "Test Vendor Role"', () => {
      expect(result).toBe('Test Vendor Role');
    });
  });

  Scenario('Accessing isDefault property', ({ When, Then }) => {
    When('I access the isDefault property', () => {
      result = adapter.isDefault;
    });
    Then('I should get true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('Accessing permissions property', ({ When, Then }) => {
    When('I access the permissions property', () => {
      result = adapter.permissions;
    });
    Then('I should get a VendorUserRolePermissionsDomainAdapter instance', () => {
      expect(result).toBeInstanceOf(VendorUserRolePermissionsDomainAdapter);
    });
  });

  Scenario('Accessing roleType property', ({ When, Then }) => {
    When('I access the roleType property', () => {
      result = adapter.roleType;
    });
    Then('I should get "vendor-user-role"', () => {
      expect(result).toBe('vendor-user-role');
    });
  });

  Scenario('Accessing community property', ({ When, Then }) => {
    When('I access the community property', () => {
      result = adapter.community;
    });
    Then('I should get a Community domain adapter instance', () => {
      expect(result).toBeInstanceOf(CommunityDomainAdapter);
    });
  });

  Scenario('Accessing specific permission', ({ When, Then }) => {
    When('I access permissions.communityPermissions.canManageVendorUserRolesAndPermissions', () => {
      result = adapter.permissions.communityPermissions.canManageVendorUserRolesAndPermissions;
    });
    Then('I should get true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('Accessing property permissions', ({ When, Then }) => {
    When('I access permissions.propertyPermissions.canManageProperties', () => {
      result = adapter.permissions.propertyPermissions.canManageProperties;
    });
    Then('I should get true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('Accessing canManageCommunitySettings', ({ When, Then }) => {
    When('I access permissions.communityPermissions.canManageCommunitySettings', () => {
      result = adapter.permissions.communityPermissions.canManageCommunitySettings;
    });
    Then('I should get true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('Accessing canEditOwnProperty', ({ When, Then }) => {
    When('I access permissions.propertyPermissions.canEditOwnProperty', () => {
      result = adapter.permissions.propertyPermissions.canEditOwnProperty;
    });
    Then('I should get true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('Accessing canManageServices', ({ When, Then }) => {
    When('I access permissions.servicePermissions.canManageServices', () => {
      result = adapter.permissions.servicePermissions.canManageServices;
    });
    Then('I should get true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('Accessing canCreateTickets for service tickets', ({ When, Then }) => {
    When('I access permissions.serviceTicketPermissions.canCreateTickets', () => {
      result = adapter.permissions.serviceTicketPermissions.canCreateTickets;
    });
    Then('I should get true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('Setting roleName property', ({ When, Then }) => {
    When('I set the roleName to "Updated Role Name"', () => {
      adapter.roleName = 'Updated Role Name';
    });
    Then('the roleName should be "Updated Role Name"', () => {
      expect(adapter.roleName).toBe('Updated Role Name');
    });
  });

  Scenario('Setting canManageVendorUserRolesAndPermissions', ({ When, Then }) => {
    When('I set permissions.communityPermissions.canManageVendorUserRolesAndPermissions to false', () => {
      adapter.permissions.communityPermissions.canManageVendorUserRolesAndPermissions = false;
    });
    Then('permissions.communityPermissions.canManageVendorUserRolesAndPermissions should be false', () => {
      expect(adapter.permissions.communityPermissions.canManageVendorUserRolesAndPermissions).toBe(false);
    });
  });

  Scenario('Accessing canManageSiteContent', ({ When, Then }) => {
    When('I access permissions.communityPermissions.canManageSiteContent', () => {
      result = adapter.permissions.communityPermissions.canManageSiteContent;
    });
    Then('I should get true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('Accessing canManageMembers', ({ When, Then }) => {
    When('I access permissions.communityPermissions.canManageMembers', () => {
      result = adapter.permissions.communityPermissions.canManageMembers;
    });
    Then('I should get true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('Accessing canManageTickets for service tickets', ({ When, Then }) => {
    When('I access permissions.serviceTicketPermissions.canManageTickets', () => {
      result = adapter.permissions.serviceTicketPermissions.canManageTickets;
    });
    Then('I should get true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('Accessing canCreateTickets for violation tickets', ({ When, Then }) => {
    When('I access permissions.violationTicketPermissions.canCreateTickets', () => {
      result = adapter.permissions.violationTicketPermissions.canCreateTickets;
    });
    Then('I should get true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('Setting canManageServices', ({ When, Then }) => {
    When('I set permissions.servicePermissions.canManageServices to false', () => {
      adapter.permissions.servicePermissions.canManageServices = false;
    });
    Then('permissions.servicePermissions.canManageServices should be false', () => {
      expect(adapter.permissions.servicePermissions.canManageServices).toBe(false);
    });
  });

  Scenario('Accessing canAssignTickets for service tickets', ({ When, Then }) => {
    When('I access permissions.serviceTicketPermissions.canAssignTickets', () => {
      result = adapter.permissions.serviceTicketPermissions.canAssignTickets;
    });
    Then('I should get true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('Accessing canWorkOnTickets for service tickets', ({ When, Then }) => {
    When('I access permissions.serviceTicketPermissions.canWorkOnTickets', () => {
      result = adapter.permissions.serviceTicketPermissions.canWorkOnTickets;
    });
    Then('I should get true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('Accessing canAssignTickets for violation tickets', ({ When, Then }) => {
    When('I access permissions.violationTicketPermissions.canAssignTickets', () => {
      result = adapter.permissions.violationTicketPermissions.canAssignTickets;
    });
    Then('I should get true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('Accessing canWorkOnTickets for violation tickets', ({ When, Then }) => {
    When('I access permissions.violationTicketPermissions.canWorkOnTickets', () => {
      result = adapter.permissions.violationTicketPermissions.canWorkOnTickets;
    });
    Then('I should get true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('Setting canAssignTickets for service tickets', ({ When, Then }) => {
    When('I set permissions.serviceTicketPermissions.canAssignTickets to false', () => {
      adapter.permissions.serviceTicketPermissions.canAssignTickets = false;
    });
    Then('permissions.serviceTicketPermissions.canAssignTickets should be false', () => {
      expect(adapter.permissions.serviceTicketPermissions.canAssignTickets).toBe(false);
    });
  });

  Scenario('Setting canWorkOnTickets for service tickets', ({ When, Then }) => {
    When('I set permissions.serviceTicketPermissions.canWorkOnTickets to false', () => {
      adapter.permissions.serviceTicketPermissions.canWorkOnTickets = false;
    });
    Then('permissions.serviceTicketPermissions.canWorkOnTickets should be false', () => {
      expect(adapter.permissions.serviceTicketPermissions.canWorkOnTickets).toBe(false);
    });
  });

  Scenario('Setting canAssignTickets for violation tickets', ({ When, Then }) => {
    When('I set permissions.violationTicketPermissions.canAssignTickets to false', () => {
      adapter.permissions.violationTicketPermissions.canAssignTickets = false;
    });
    Then('permissions.violationTicketPermissions.canAssignTickets should be false', () => {
      expect(adapter.permissions.violationTicketPermissions.canAssignTickets).toBe(false);
    });
  });

  Scenario('Setting canWorkOnTickets for violation tickets', ({ When, Then }) => {
    When('I set permissions.violationTicketPermissions.canWorkOnTickets to false', () => {
      adapter.permissions.violationTicketPermissions.canWorkOnTickets = false;
    });
    Then('permissions.violationTicketPermissions.canWorkOnTickets should be false', () => {
      expect(adapter.permissions.violationTicketPermissions.canWorkOnTickets).toBe(false);
    });
  });

  Scenario('Setting canManageProperties', ({ When, Then }) => {
    When('I set permissions.propertyPermissions.canManageProperties to false', () => {
      adapter.permissions.propertyPermissions.canManageProperties = false;
    });
    Then('permissions.propertyPermissions.canManageProperties should be false', () => {
      expect(adapter.permissions.propertyPermissions.canManageProperties).toBe(false);
    });
  });

  Scenario('Setting canEditOwnProperty', ({ When, Then }) => {
    When('I set permissions.propertyPermissions.canEditOwnProperty to false', () => {
      adapter.permissions.propertyPermissions.canEditOwnProperty = false;
    });
    Then('permissions.propertyPermissions.canEditOwnProperty should be false', () => {
      expect(adapter.permissions.propertyPermissions.canEditOwnProperty).toBe(false);
    });
  });

  Scenario('Setting canManageCommunitySettings', ({ When, Then }) => {
    When('I set permissions.communityPermissions.canManageCommunitySettings to false', () => {
      adapter.permissions.communityPermissions.canManageCommunitySettings = false;
    });
    Then('permissions.communityPermissions.canManageCommunitySettings should be false', () => {
      expect(adapter.permissions.communityPermissions.canManageCommunitySettings).toBe(false);
    });
  });

  Scenario('Setting canManageSiteContent', ({ When, Then }) => {
    When('I set permissions.communityPermissions.canManageSiteContent to false', () => {
      adapter.permissions.communityPermissions.canManageSiteContent = false;
    });
    Then('permissions.communityPermissions.canManageSiteContent should be false', () => {
      expect(adapter.permissions.communityPermissions.canManageSiteContent).toBe(false);
    });
  });

  Scenario('Setting canManageMembers', ({ When, Then }) => {
    When('I set permissions.communityPermissions.canManageMembers to false', () => {
      adapter.permissions.communityPermissions.canManageMembers = false;
    });
    Then('permissions.communityPermissions.canManageMembers should be false', () => {
      expect(adapter.permissions.communityPermissions.canManageMembers).toBe(false);
    });
  });

  Scenario('Setting canEditOwnMemberProfile', ({ When, Then }) => {
    When('I set permissions.communityPermissions.canEditOwnMemberProfile to false', () => {
      adapter.permissions.communityPermissions.canEditOwnMemberProfile = false;
    });
    Then('permissions.communityPermissions.canEditOwnMemberProfile should be false', () => {
      expect(adapter.permissions.communityPermissions.canEditOwnMemberProfile).toBe(false);
    });
  });

  Scenario('Setting canEditOwnMemberAccounts', ({ When, Then }) => {
    When('I set permissions.communityPermissions.canEditOwnMemberAccounts to false', () => {
      adapter.permissions.communityPermissions.canEditOwnMemberAccounts = false;
    });
    Then('permissions.communityPermissions.canEditOwnMemberAccounts should be false', () => {
      expect(adapter.permissions.communityPermissions.canEditOwnMemberAccounts).toBe(false);
    });
  });

  Scenario('Setting isDefault property', ({ When, Then }) => {
    When('I set the isDefault to false', () => {
      adapter.isDefault = false;
    });
    Then('the isDefault should be false', () => {
      expect(adapter.isDefault).toBe(false);
    });
  });
});

test.for(typeConverterFeature, ({ Scenario, Background, BeforeEachScenario }) => {
  let doc: VendorUserRole;
  let communityDoc: Community;
  let converter: VendorUserRoleConverter;
  let passport: Domain.Passport;
  let result: unknown;

  BeforeEachScenario(() => {
    communityDoc = makeCommunityDoc();
    doc = makeVendorUserRoleDoc({
      community: communityDoc,
    });
    converter = new VendorUserRoleConverter();
    passport = makeMockPassport();
    result = undefined;
  });

  Background(({ Given }) => {
    Given(
      'a valid Mongoose VendorUserRole document with roleName "Test Vendor Role", isDefault true, populated community field, and permissions',
      () => {
        communityDoc = makeCommunityDoc();
        doc = makeVendorUserRoleDoc({
          community: communityDoc,
        });
      }
    );
  });

  Scenario('Converting a Mongoose VendorUserRole document to a domain object', ({ Given, When, Then, And }) => {
    Given('a VendorUserRoleConverter instance', () => {
      converter = new VendorUserRoleConverter();
    });
    When('I call toDomain with the Mongoose VendorUserRole document', () => {
      result = converter.toDomain(doc, passport);
    });
    Then('I should receive a VendorUserRole domain object', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.Community.Role.VendorUserRole.VendorUserRole);
    });
    And('the domain object\'s roleName should be "Test Vendor Role"', () => {
      expect((result as Domain.Contexts.Community.Role.VendorUserRole.VendorUserRole<VendorUserRoleDomainAdapter>).roleName).toBe('Test Vendor Role');
    });
    And('the domain object\'s isDefault should be true', () => {
      expect((result as Domain.Contexts.Community.Role.VendorUserRole.VendorUserRole<VendorUserRoleDomainAdapter>).isDefault).toBe(true);
    });
    And('the domain object\'s community should be a Community domain object', () => {
      const { community } = result as Domain.Contexts.Community.Role.VendorUserRole.VendorUserRole<VendorUserRoleDomainAdapter>;
      expect(community).toBeInstanceOf(Domain.Contexts.Community.Community.Community);
    });
  });

  Scenario('Converting a domain object to a Mongoose VendorUserRole document', ({ Given, And, When, Then }) => {
    let domainObj: Domain.Contexts.Community.Role.VendorUserRole.VendorUserRole<VendorUserRoleDomainAdapter>;
    let communityAdapter: CommunityDomainAdapter;
    let communityDomainObj: Domain.Contexts.Community.Community.Community<CommunityDomainAdapter>;
    let resultDoc: VendorUserRole;

    Given('a VendorUserRoleConverter instance', () => {
      converter = new VendorUserRoleConverter();
    });
    And('a VendorUserRole domain object with roleName "New Role", isDefault false, and valid community', () => {
      communityAdapter = new CommunityDomainAdapter(communityDoc);
      communityDomainObj = new Domain.Contexts.Community.Community.Community(communityAdapter, passport);

      const roleDoc = makeVendorUserRoleDoc({
        roleName: 'New Role',
        isDefault: false,
        community: communityDoc,
      });
      const adapter = new VendorUserRoleDomainAdapter(roleDoc);
      adapter.community = communityDomainObj;
      domainObj = new Domain.Contexts.Community.Role.VendorUserRole.VendorUserRole(adapter, passport);
    });
    When('I call toPersistence with the VendorUserRole domain object', () => {
      resultDoc = converter.toPersistence(domainObj);
    });
    Then('I should receive a Mongoose VendorUserRole document', () => {
      expect(resultDoc).toBeDefined();
      expect(resultDoc).toHaveProperty('roleName');
    });
    And('the document\'s roleName should be "New Role"', () => {
      expect(resultDoc.roleName).toBe('New Role');
    });
    And('the document\'s isDefault should be false', () => {
      expect(resultDoc.isDefault).toBe(false);
    });
    And('the document\'s community should be set to the correct community document', () => {
      expect(resultDoc.community).toBe(communityDoc);
    });
  });
});