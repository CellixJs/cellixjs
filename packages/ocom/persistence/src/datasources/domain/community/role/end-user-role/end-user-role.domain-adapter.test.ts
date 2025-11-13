import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Passport } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { CommunityDomainAdapter } from '../../community/community.domain-adapter.ts';

const test = { for: describeFeature };
import {
    EndUserRoleCommunityPermissionsDomainAdapter,
    EndUserRoleConverter,
    EndUserRoleDomainAdapter,
    EndUserRolePermissionsDomainAdapter,
    EndUserRolePropertyPermissionsDomainAdapter,
    EndUserRoleServicePermissionsDomainAdapter,
    EndUserRoleServiceTicketPermissionsDomainAdapter,
    EndUserRoleViolationTicketPermissionsDomainAdapter,
} from './end-user-role.domain-adapter.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const domainAdapterFeature = await loadFeature(
  path.resolve(__dirname, 'features/end-user-role.domain-adapter.feature')
);
const typeConverterFeature = await loadFeature(
  path.resolve(__dirname, 'features/end-user-role.type-converter.feature')
);

function makeEndUserRoleDoc(overrides: Partial<Models.Role.EndUserRole> = {}) {
  const base = {
    id: '507f1f77bcf86cd799439011',
    roleName: 'Test Role',
    isDefault: true,
    roleType: 'end-user-role',
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
    set(key: keyof Models.Role.EndUserRole, value: unknown) {
      // Type-safe property assignment
      (this as Models.Role.EndUserRole)[key] = value as never;
    },
    ...overrides,
  } as Models.Role.EndUserRole;
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
      forEndUser: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Passport;
}

test.for(domainAdapterFeature, ({ Scenario, Background, BeforeEachScenario }) => {
  let doc: Models.Role.EndUserRole;
  let adapter: EndUserRoleDomainAdapter;
  let communityDoc: Models.Community.Community;
  let communityAdapter: CommunityDomainAdapter;
  let result: unknown;

  BeforeEachScenario(() => {
    communityDoc = makeCommunityDoc();
    doc = makeEndUserRoleDoc({
      community: communityDoc,
    });
    adapter = new EndUserRoleDomainAdapter(doc);
    result = undefined;
  });

  Background(({ Given }) => {
    Given(
      'a valid Mongoose EndUserRole document with roleName "Test Role", isDefault true, populated community field, and permissions',
      () => {
        communityDoc = makeCommunityDoc();
        doc = makeEndUserRoleDoc({
          community: communityDoc,
        });
        adapter = new EndUserRoleDomainAdapter(doc);
      }
    );
  });

  Scenario('Getting and setting the roleName property', ({ Given, When, Then }) => {
    Given('an EndUserRoleDomainAdapter for the document', () => {
      adapter = new EndUserRoleDomainAdapter(doc);
    });
    When('I get the roleName property', () => {
      result = adapter.roleName;
    });
    Then('it should return "Test Role"', () => {
      expect(result).toBe('Test Role');
    });
    When('I set the roleName property to "New Role Name"', () => {
      adapter.roleName = 'New Role Name';
    });
    Then('the document\'s roleName should be "New Role Name"', () => {
      expect(doc.roleName).toBe('New Role Name');
    });
  });

  Scenario('Getting and setting the isDefault property', ({ Given, When, Then }) => {
    Given('an EndUserRoleDomainAdapter for the document', () => {
      adapter = new EndUserRoleDomainAdapter(doc);
    });
    When('I get the isDefault property', () => {
      result = adapter.isDefault;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the isDefault property to false', () => {
      adapter.isDefault = false;
    });
    Then('the document\'s isDefault should be false', () => {
      expect(doc.isDefault).toBe(false);
    });
  });

  Scenario('Getting the community property when populated', ({ Given, When, Then }) => {
    Given('an EndUserRoleDomainAdapter for the document', () => {
      adapter = new EndUserRoleDomainAdapter(doc);
    });
    When('I get the community property', () => {
      result = adapter.community;
    });
    Then('it should return a CommunityDomainAdapter instance with the correct community data', () => {
      expect(result).toBeInstanceOf(CommunityDomainAdapter);
      expect((result as CommunityDomainAdapter).doc).toBe(communityDoc);
    });
  });

  Scenario('Getting the community property when not populated', ({ Given, When, Then }) => {
    let gettingCommunityWhenNotPopulated: () => void;
    Given('an EndUserRoleDomainAdapter for a document with community as an ObjectId', () => {
      doc = makeEndUserRoleDoc({ community: new MongooseSeedwork.ObjectId() });
      adapter = new EndUserRoleDomainAdapter(doc);
    });
    When('I get the community property', () => {
      gettingCommunityWhenNotPopulated = () => {
        result = adapter.community;
      };
    });
    Then('an error should be thrown indicating "community is not populated or is not of the correct type"', () => {
      expect(gettingCommunityWhenNotPopulated).toThrow();
      expect(gettingCommunityWhenNotPopulated).throws(/community is not populated/);
    });
  });

  Scenario('Setting the community property with a valid Community domain object', ({ Given, And, When, Then }) => {
    let communityDomainObj: Community<CommunityDomainAdapter>;
    Given('an EndUserRoleDomainAdapter for the document', () => {
      adapter = new EndUserRoleDomainAdapter(doc);
    });
    And('a valid Community domain object', () => {
      communityAdapter = new CommunityDomainAdapter(communityDoc);
      communityDomainObj = new Community(communityAdapter, makeMockPassport());
    });
    When('I set the community property to the Community domain object', () => {
      adapter.community = communityDomainObj;
    });
    Then('the document\'s community should be set to the community\'s doc', () => {
      expect(doc.community).toBe(communityDoc);
    });
  });

  Scenario('Setting the community property with an invalid value', ({ Given, And, When, Then }) => {
    let settingCommunityWithInvalidValue: () => void;
    Given('an EndUserRoleDomainAdapter for the document', () => {
      adapter = new EndUserRoleDomainAdapter(doc);
    });
    And('an object that is not a Community domain object', () => {
      communityAdapter = {} as CommunityDomainAdapter;
    });
    When('I try to set the community property to the invalid object', () => {
      settingCommunityWithInvalidValue = () => {
        adapter.community = communityAdapter;
      };
    });
    Then('an error should be thrown indicating "community reference is missing id"', () => {
      expect(settingCommunityWithInvalidValue).toThrow();
      expect(settingCommunityWithInvalidValue).throws(/community reference is missing id/);
    });
  });

  Scenario('Getting the permissions property', ({ Given, When, Then }) => {
    Given('an EndUserRoleDomainAdapter for the document', () => {
      adapter = new EndUserRoleDomainAdapter(doc);
    });
    When('I get the permissions property', () => {
      result = adapter.permissions;
    });
    Then('it should return an EndUserRolePermissionsDomainAdapter instance', () => {
      expect(result).toBeInstanceOf(EndUserRolePermissionsDomainAdapter);
    });
  });

  Scenario('Getting the roleType property', ({ Given, When, Then }) => {
    Given('an EndUserRoleDomainAdapter for the document', () => {
      adapter = new EndUserRoleDomainAdapter(doc);
    });
    When('I get the roleType property', () => {
      result = adapter.roleType;
    });
    Then('it should return the expected role type', () => {
      expect(result).toBe('end-user-role');
    });
  });

  Scenario('EndUserRolePermissionsDomainAdapter getting communityPermissions property', ({ Given, When, Then }) => {
    let permissionsAdapter: EndUserRolePermissionsDomainAdapter;

    Given('an EndUserRolePermissionsDomainAdapter for a permissions document', () => {
      permissionsAdapter = new EndUserRolePermissionsDomainAdapter(doc.permissions);
    });
    When('I get the communityPermissions property', () => {
      result = permissionsAdapter.communityPermissions;
    });
    Then('it should return an EndUserRoleCommunityPermissionsDomainAdapter instance', () => {
      expect(result).toBeInstanceOf(EndUserRoleCommunityPermissionsDomainAdapter);
    });
  });

  Scenario('EndUserRolePermissionsDomainAdapter getting propertyPermissions property', ({ Given, When, Then }) => {
    let permissionsAdapter: EndUserRolePermissionsDomainAdapter;

    Given('an EndUserRolePermissionsDomainAdapter for a permissions document', () => {
      permissionsAdapter = new EndUserRolePermissionsDomainAdapter(doc.permissions);
    });
    When('I get the propertyPermissions property', () => {
      result = permissionsAdapter.propertyPermissions;
    });
    Then('it should return an EndUserRolePropertyPermissionsDomainAdapter instance', () => {
      expect(result).toBeInstanceOf(EndUserRolePropertyPermissionsDomainAdapter);
    });
  });

  Scenario('EndUserRolePermissionsDomainAdapter getting serviceTicketPermissions property', ({ Given, When, Then }) => {
    let permissionsAdapter: EndUserRolePermissionsDomainAdapter;

    Given('an EndUserRolePermissionsDomainAdapter for a permissions document', () => {
      permissionsAdapter = new EndUserRolePermissionsDomainAdapter(doc.permissions);
    });
    When('I get the serviceTicketPermissions property', () => {
      result = permissionsAdapter.serviceTicketPermissions;
    });
    Then('it should return an EndUserRoleServiceTicketPermissionsDomainAdapter instance', () => {
      expect(result).toBeInstanceOf(EndUserRoleServiceTicketPermissionsDomainAdapter);
    });
  });

  Scenario('EndUserRolePermissionsDomainAdapter getting servicePermissions property', ({ Given, When, Then }) => {
    let permissionsAdapter: EndUserRolePermissionsDomainAdapter;

    Given('an EndUserRolePermissionsDomainAdapter for a permissions document', () => {
      permissionsAdapter = new EndUserRolePermissionsDomainAdapter(doc.permissions);
    });
    When('I get the servicePermissions property', () => {
      result = permissionsAdapter.servicePermissions;
    });
    Then('it should return an EndUserRoleServicePermissionsDomainAdapter instance', () => {
      expect(result).toBeInstanceOf(EndUserRoleServicePermissionsDomainAdapter);
    });
  });

  Scenario('EndUserRolePermissionsDomainAdapter getting violationTicketPermissions property', ({ Given, When, Then }) => {
    let permissionsAdapter: EndUserRolePermissionsDomainAdapter;

    Given('an EndUserRolePermissionsDomainAdapter for a permissions document', () => {
      permissionsAdapter = new EndUserRolePermissionsDomainAdapter(doc.permissions);
    });
    When('I get the violationTicketPermissions property', () => {
      result = permissionsAdapter.violationTicketPermissions;
    });
    Then('it should return an EndUserRoleViolationTicketPermissionsDomainAdapter instance', () => {
      expect(result).toBeInstanceOf(EndUserRoleViolationTicketPermissionsDomainAdapter);
    });
  });

  Scenario('EndUserRoleCommunityPermissionsDomainAdapter getting and setting canManageEndUserRolesAndPermissions property', ({ Given, When, Then }) => {
    let communityPermissionsAdapter: EndUserRoleCommunityPermissionsDomainAdapter;

    Given('an EndUserRoleCommunityPermissionsDomainAdapter for a community permissions document', () => {
      communityPermissionsAdapter = new EndUserRoleCommunityPermissionsDomainAdapter(doc.permissions.communityPermissions);
    });
    When('I get the canManageEndUserRolesAndPermissions property', () => {
      result = communityPermissionsAdapter.canManageEndUserRolesAndPermissions;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the canManageEndUserRolesAndPermissions property to false', () => {
      communityPermissionsAdapter.canManageEndUserRolesAndPermissions = false;
    });
    Then('the document\'s canManageRolesAndPermissions should be false', () => {
      expect(doc.permissions.communityPermissions.canManageRolesAndPermissions).toBe(false);
    });
  });

  Scenario('EndUserRoleCommunityPermissionsDomainAdapter getting and setting canManageCommunitySettings property', ({ Given, When, Then }) => {
    let communityPermissionsAdapter: EndUserRoleCommunityPermissionsDomainAdapter;

    Given('an EndUserRoleCommunityPermissionsDomainAdapter for a community permissions document', () => {
      communityPermissionsAdapter = new EndUserRoleCommunityPermissionsDomainAdapter(doc.permissions.communityPermissions);
    });
    When('I get the canManageCommunitySettings property', () => {
      result = communityPermissionsAdapter.canManageCommunitySettings;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the canManageCommunitySettings property to false', () => {
      communityPermissionsAdapter.canManageCommunitySettings = false;
    });
    Then('the document\'s canManageCommunitySettings should be false', () => {
      expect(doc.permissions.communityPermissions.canManageCommunitySettings).toBe(false);
    });
  });

  Scenario('EndUserRoleCommunityPermissionsDomainAdapter getting and setting canManageSiteContent property', ({ Given, When, Then }) => {
    let communityPermissionsAdapter: EndUserRoleCommunityPermissionsDomainAdapter;

    Given('an EndUserRoleCommunityPermissionsDomainAdapter for a community permissions document', () => {
      communityPermissionsAdapter = new EndUserRoleCommunityPermissionsDomainAdapter(doc.permissions.communityPermissions);
    });
    When('I get the canManageSiteContent property', () => {
      result = communityPermissionsAdapter.canManageSiteContent;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the canManageSiteContent property to false', () => {
      communityPermissionsAdapter.canManageSiteContent = false;
    });
    Then('the document\'s canManageSiteContent should be false', () => {
      expect(doc.permissions.communityPermissions.canManageSiteContent).toBe(false);
    });
  });

  Scenario('EndUserRoleCommunityPermissionsDomainAdapter getting and setting canManageMembers property', ({ Given, When, Then }) => {
    let communityPermissionsAdapter: EndUserRoleCommunityPermissionsDomainAdapter;

    Given('an EndUserRoleCommunityPermissionsDomainAdapter for a community permissions document', () => {
      communityPermissionsAdapter = new EndUserRoleCommunityPermissionsDomainAdapter(doc.permissions.communityPermissions);
    });
    When('I get the canManageMembers property', () => {
      result = communityPermissionsAdapter.canManageMembers;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the canManageMembers property to false', () => {
      communityPermissionsAdapter.canManageMembers = false;
    });
    Then('the document\'s canManageMembers should be false', () => {
      expect(doc.permissions.communityPermissions.canManageMembers).toBe(false);
    });
  });

  Scenario('EndUserRoleCommunityPermissionsDomainAdapter getting and setting canEditOwnMemberProfile property', ({ Given, When, Then }) => {
    let communityPermissionsAdapter: EndUserRoleCommunityPermissionsDomainAdapter;

    Given('an EndUserRoleCommunityPermissionsDomainAdapter for a community permissions document', () => {
      communityPermissionsAdapter = new EndUserRoleCommunityPermissionsDomainAdapter(doc.permissions.communityPermissions);
    });
    When('I get the canEditOwnMemberProfile property', () => {
      result = communityPermissionsAdapter.canEditOwnMemberProfile;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the canEditOwnMemberProfile property to false', () => {
      communityPermissionsAdapter.canEditOwnMemberProfile = false;
    });
    Then('the document\'s canEditOwnMemberProfile should be false', () => {
      expect(doc.permissions.communityPermissions.canEditOwnMemberProfile).toBe(false);
    });
  });

  Scenario('EndUserRoleCommunityPermissionsDomainAdapter getting and setting canEditOwnMemberAccounts property', ({ Given, When, Then }) => {
    let communityPermissionsAdapter: EndUserRoleCommunityPermissionsDomainAdapter;

    Given('an EndUserRoleCommunityPermissionsDomainAdapter for a community permissions document', () => {
      communityPermissionsAdapter = new EndUserRoleCommunityPermissionsDomainAdapter(doc.permissions.communityPermissions);
    });
    When('I get the canEditOwnMemberAccounts property', () => {
      result = communityPermissionsAdapter.canEditOwnMemberAccounts;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the canEditOwnMemberAccounts property to false', () => {
      communityPermissionsAdapter.canEditOwnMemberAccounts = false;
    });
    Then('the document\'s canEditOwnMemberAccounts should be false', () => {
      expect(doc.permissions.communityPermissions.canEditOwnMemberAccounts).toBe(false);
    });
  });

  Scenario('EndUserRolePropertyPermissionsDomainAdapter getting and setting canManageProperties property', ({ Given, When, Then }) => {
    let propertyPermissionsAdapter: EndUserRolePropertyPermissionsDomainAdapter;

    Given('an EndUserRolePropertyPermissionsDomainAdapter for a property permissions document', () => {
      propertyPermissionsAdapter = new EndUserRolePropertyPermissionsDomainAdapter(doc.permissions.propertyPermissions);
    });
    When('I get the canManageProperties property', () => {
      result = propertyPermissionsAdapter.canManageProperties;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the canManageProperties property to false', () => {
      propertyPermissionsAdapter.canManageProperties = false;
    });
    Then('the document\'s canManageProperties should be false', () => {
      expect(doc.permissions.propertyPermissions.canManageProperties).toBe(false);
    });
  });

  Scenario('EndUserRolePropertyPermissionsDomainAdapter getting and setting canEditOwnProperty property', ({ Given, When, Then }) => {
    let propertyPermissionsAdapter: EndUserRolePropertyPermissionsDomainAdapter;

    Given('an EndUserRolePropertyPermissionsDomainAdapter for a property permissions document', () => {
      propertyPermissionsAdapter = new EndUserRolePropertyPermissionsDomainAdapter(doc.permissions.propertyPermissions);
    });
    When('I get the canEditOwnProperty property', () => {
      result = propertyPermissionsAdapter.canEditOwnProperty;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the canEditOwnProperty property to false', () => {
      propertyPermissionsAdapter.canEditOwnProperty = false;
    });
    Then('the document\'s canEditOwnProperty should be false', () => {
      expect(doc.permissions.propertyPermissions.canEditOwnProperty).toBe(false);
    });
  });

  Scenario('EndUserRoleServicePermissionsDomainAdapter getting and setting canManageServices property', ({ Given, When, Then }) => {
    let servicePermissionsAdapter: EndUserRoleServicePermissionsDomainAdapter;

    Given('an EndUserRoleServicePermissionsDomainAdapter for a service permissions document', () => {
      servicePermissionsAdapter = new EndUserRoleServicePermissionsDomainAdapter(doc.permissions.servicePermissions);
    });
    When('I get the canManageServices property', () => {
      result = servicePermissionsAdapter.canManageServices;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the canManageServices property to false', () => {
      servicePermissionsAdapter.canManageServices = false;
    });
    Then('the document\'s canManageServices should be false', () => {
      expect(doc.permissions.servicePermissions.canManageServices).toBe(false);
    });
  });

  Scenario('EndUserRoleServiceTicketPermissionsDomainAdapter getting and setting canCreateTickets property', ({ Given, When, Then }) => {
    let serviceTicketPermissionsAdapter: EndUserRoleServiceTicketPermissionsDomainAdapter;

    Given('an EndUserRoleServiceTicketPermissionsDomainAdapter for a service ticket permissions document', () => {
      serviceTicketPermissionsAdapter = new EndUserRoleServiceTicketPermissionsDomainAdapter(doc.permissions.serviceTicketPermissions);
    });
    When('I get the canCreateTickets property', () => {
      result = serviceTicketPermissionsAdapter.canCreateTickets;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the canCreateTickets property to false', () => {
      serviceTicketPermissionsAdapter.canCreateTickets = false;
    });
    Then('the document\'s canCreateTickets should be false', () => {
      expect(doc.permissions.serviceTicketPermissions.canCreateTickets).toBe(false);
    });
  });

  Scenario('EndUserRoleServiceTicketPermissionsDomainAdapter getting and setting canManageTickets property', ({ Given, When, Then }) => {
    let serviceTicketPermissionsAdapter: EndUserRoleServiceTicketPermissionsDomainAdapter;

    Given('an EndUserRoleServiceTicketPermissionsDomainAdapter for a service ticket permissions document', () => {
      serviceTicketPermissionsAdapter = new EndUserRoleServiceTicketPermissionsDomainAdapter(doc.permissions.serviceTicketPermissions);
    });
    When('I get the canManageTickets property', () => {
      result = serviceTicketPermissionsAdapter.canManageTickets;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the canManageTickets property to false', () => {
      serviceTicketPermissionsAdapter.canManageTickets = false;
    });
    Then('the document\'s canManageTickets should be false', () => {
      expect(doc.permissions.serviceTicketPermissions.canManageTickets).toBe(false);
    });
  });

  Scenario('EndUserRoleServiceTicketPermissionsDomainAdapter getting and setting canAssignTickets property', ({ Given, When, Then }) => {
    let serviceTicketPermissionsAdapter: EndUserRoleServiceTicketPermissionsDomainAdapter;

    Given('an EndUserRoleServiceTicketPermissionsDomainAdapter for a service ticket permissions document', () => {
      serviceTicketPermissionsAdapter = new EndUserRoleServiceTicketPermissionsDomainAdapter(doc.permissions.serviceTicketPermissions);
    });
    When('I get the canAssignTickets property', () => {
      result = serviceTicketPermissionsAdapter.canAssignTickets;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the canAssignTickets property to false', () => {
      serviceTicketPermissionsAdapter.canAssignTickets = false;
    });
    Then('the document\'s canAssignTickets should be false', () => {
      expect(doc.permissions.serviceTicketPermissions.canAssignTickets).toBe(false);
    });
  });

  Scenario('EndUserRoleServiceTicketPermissionsDomainAdapter getting and setting canWorkOnTickets property', ({ Given, When, Then }) => {
    let serviceTicketPermissionsAdapter: EndUserRoleServiceTicketPermissionsDomainAdapter;

    Given('an EndUserRoleServiceTicketPermissionsDomainAdapter for a service ticket permissions document', () => {
      serviceTicketPermissionsAdapter = new EndUserRoleServiceTicketPermissionsDomainAdapter(doc.permissions.serviceTicketPermissions);
    });
    When('I get the canWorkOnTickets property', () => {
      result = serviceTicketPermissionsAdapter.canWorkOnTickets;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the canWorkOnTickets property to false', () => {
      serviceTicketPermissionsAdapter.canWorkOnTickets = false;
    });
    Then('the document\'s canWorkOnTickets should be false', () => {
      expect(doc.permissions.serviceTicketPermissions.canWorkOnTickets).toBe(false);
    });
  });

  Scenario('EndUserRoleViolationTicketPermissionsDomainAdapter getting and setting canCreateTickets property', ({ Given, When, Then }) => {
    let violationTicketPermissionsAdapter: EndUserRoleViolationTicketPermissionsDomainAdapter;

    Given('an EndUserRoleViolationTicketPermissionsDomainAdapter for a violation ticket permissions document', () => {
      violationTicketPermissionsAdapter = new EndUserRoleViolationTicketPermissionsDomainAdapter(doc.permissions.violationTicketPermissions);
    });
    When('I get the canCreateTickets property', () => {
      result = violationTicketPermissionsAdapter.canCreateTickets;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the canCreateTickets property to false', () => {
      violationTicketPermissionsAdapter.canCreateTickets = false;
    });
    Then('the document\'s canCreateTickets should be false', () => {
      expect(doc.permissions.violationTicketPermissions.canCreateTickets).toBe(false);
    });
  });

  Scenario('EndUserRoleViolationTicketPermissionsDomainAdapter getting and setting canManageTickets property', ({ Given, When, Then }) => {
    let violationTicketPermissionsAdapter: EndUserRoleViolationTicketPermissionsDomainAdapter;

    Given('an EndUserRoleViolationTicketPermissionsDomainAdapter for a violation ticket permissions document', () => {
      violationTicketPermissionsAdapter = new EndUserRoleViolationTicketPermissionsDomainAdapter(doc.permissions.violationTicketPermissions);
    });
    When('I get the canManageTickets property', () => {
      result = violationTicketPermissionsAdapter.canManageTickets;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the canManageTickets property to false', () => {
      violationTicketPermissionsAdapter.canManageTickets = false;
    });
    Then('the document\'s canManageTickets should be false', () => {
      expect(doc.permissions.violationTicketPermissions.canManageTickets).toBe(false);
    });
  });

  Scenario('EndUserRoleViolationTicketPermissionsDomainAdapter getting and setting canAssignTickets property', ({ Given, When, Then }) => {
    let violationTicketPermissionsAdapter: EndUserRoleViolationTicketPermissionsDomainAdapter;

    Given('an EndUserRoleViolationTicketPermissionsDomainAdapter for a violation ticket permissions document', () => {
      violationTicketPermissionsAdapter = new EndUserRoleViolationTicketPermissionsDomainAdapter(doc.permissions.violationTicketPermissions);
    });
    When('I get the canAssignTickets property', () => {
      result = violationTicketPermissionsAdapter.canAssignTickets;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the canAssignTickets property to false', () => {
      violationTicketPermissionsAdapter.canAssignTickets = false;
    });
    Then('the document\'s canAssignTickets should be false', () => {
      expect(doc.permissions.violationTicketPermissions.canAssignTickets).toBe(false);
    });
  });

  Scenario('EndUserRoleViolationTicketPermissionsDomainAdapter getting and setting canWorkOnTickets property', ({ Given, When, Then }) => {
    let violationTicketPermissionsAdapter: EndUserRoleViolationTicketPermissionsDomainAdapter;

    Given('an EndUserRoleViolationTicketPermissionsDomainAdapter for a violation ticket permissions document', () => {
      violationTicketPermissionsAdapter = new EndUserRoleViolationTicketPermissionsDomainAdapter(doc.permissions.violationTicketPermissions);
    });
    When('I get the canWorkOnTickets property', () => {
      result = violationTicketPermissionsAdapter.canWorkOnTickets;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the canWorkOnTickets property to false', () => {
      violationTicketPermissionsAdapter.canWorkOnTickets = false;
    });
    Then('the document\'s canWorkOnTickets should be false', () => {
      expect(doc.permissions.violationTicketPermissions.canWorkOnTickets).toBe(false);
    });
  });
});

test.for(typeConverterFeature, ({ Scenario, Background, BeforeEachScenario }) => {
  let doc: Models.Role.EndUserRole;
  let communityDoc: Models.Community.Community;
  let converter: EndUserRoleConverter;
  let passport: Passport;
  let result: unknown;

  BeforeEachScenario(() => {
    communityDoc = makeCommunityDoc();
    doc = makeEndUserRoleDoc({
      community: communityDoc,
    });
    converter = new EndUserRoleConverter();
    passport = makeMockPassport();
    result = undefined;
  });

  Background(({ Given }) => {
    Given(
      'a valid Mongoose EndUserRole document with roleName "Test Role", isDefault true, populated community field, and permissions',
      () => {
        communityDoc = makeCommunityDoc();
        doc = makeEndUserRoleDoc({
          community: communityDoc,
        });
      }
    );
  });

  Scenario('Converting a Mongoose EndUserRole document to a domain object', ({ Given, When, Then, And }) => {
    Given('an EndUserRoleConverter instance', () => {
      converter = new EndUserRoleConverter();
    });
    When('I call toDomain with the Mongoose EndUserRole document', () => {
      result = converter.toDomain(doc, passport);
    });
    Then('I should receive an EndUserRole domain object', () => {
      expect(result).toBeInstanceOf(EndUserRole);
    });
    And('the domain object\'s roleName should be "Test Role"', () => {
      expect((result as EndUserRole<EndUserRoleDomainAdapter>).roleName).toBe('Test Role');
    });
    And('the domain object\'s isDefault should be true', () => {
      expect((result as EndUserRole<EndUserRoleDomainAdapter>).isDefault).toBe(true);
    });
    And('the domain object\'s community should be a Community domain object', () => {
      const { community } = result as EndUserRole<EndUserRoleDomainAdapter>;
      expect(community).toBeInstanceOf(Community);
    });
  });

  Scenario('Converting a domain object to a Mongoose EndUserRole document', ({ Given, And, When, Then }) => {
    let domainObj: EndUserRole<EndUserRoleDomainAdapter>;
    let communityAdapter: CommunityDomainAdapter;
    let communityDomainObj: Community<CommunityDomainAdapter>;
    let resultDoc: Models.Role.EndUserRole;

    Given('an EndUserRoleConverter instance', () => {
      converter = new EndUserRoleConverter();
    });
    And('an EndUserRole domain object with roleName "New Role", isDefault false, and valid community', () => {
      communityAdapter = new CommunityDomainAdapter(communityDoc);
      communityDomainObj = new Community(communityAdapter, passport);

      const roleDoc = makeEndUserRoleDoc({
        roleName: 'New Role',
        isDefault: false,
        community: communityDoc,
      });
      const adapter = new EndUserRoleDomainAdapter(roleDoc);
      adapter.community = communityDomainObj;
      domainObj = new EndUserRole(adapter, passport);
    });
    When('I call toPersistence with the EndUserRole domain object', () => {
      resultDoc = converter.toPersistence(domainObj);
    });
    Then('I should receive a Mongoose EndUserRole document', () => {
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