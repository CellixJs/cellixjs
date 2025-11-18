import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { expect, vi } from 'vitest';
import { CommunityDomainAdapter } from '../../community/community.domain-adapter.ts';

const test = { for: describeFeature };

import { VendorUserRoleConverter, VendorUserRoleDomainAdapter } from './vendor-user-role.domain-adapter.ts';
// Direct imports from domain package
import type * as Community from '@ocom/domain/contexts/community';
import type * as VendorUserRole from '@ocom/domain/contexts/vendor-user-role';
import type { Passport } from '@ocom/domain/contexts/passport';
import { Community as CommunityClass } from '@ocom/domain/contexts/community';
import { VendorUserRole as VendorUserRoleClass } from '@ocom/domain/contexts/vendor-user-role';


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const typeConverterFeature = await loadFeature(
  path.resolve(__dirname, 'features/vendor-user-role.type-converter.feature')
);

function makeVendorUserRoleDoc(overrides: Partial<Models.Role.VendorUserRole> = {}) {
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
    set(key: keyof Models.Role.VendorUserRole, value: unknown) {
      // Type-safe property assignment
      (this as unknown as Models.Role.VendorUserRole)[key] = value as never;
    },
    toObject() {
      return this;
    },
  };
  const merged = { ...base, ...overrides };
  return vi.mocked(merged as unknown as Models.Role.VendorUserRole);
}

function makeCommunityDoc(overrides: Partial<Models.Community.Community> = {}) {
  const base = {
    id: '507f1f77bcf86cd799439012',
    name: 'Test Community',
    description: 'A test community',
    settings: {},
  };
  return { ...base, ...overrides } as Models.Community.Community;
}

function makeMockPassport(): Passport {
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
    service: {
      forService: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
    user: {
      forVendorUser: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Passport;
}

test.for(typeConverterFeature, ({ Scenario, Background, BeforeEachScenario }) => {
  let doc: Models.Role.VendorUserRole;
  let communityDoc: Models.Community.Community;
  let converter: VendorUserRoleConverter;
  let passport: Passport;
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
      expect(result).toBeInstanceOf(VendorUserRoleClass);
    });
    And('the domain object\'s roleName should be "Test Vendor Role"', () => {
      expect((result as VendorUserRole.VendorUserRole<VendorUserRoleDomainAdapter>).roleName).toBe('Test Vendor Role');
    });
    And('the domain object\'s isDefault should be true', () => {
      expect((result as VendorUserRole.VendorUserRole<VendorUserRoleDomainAdapter>).isDefault).toBe(true);
    });
    And('the domain object\'s community should be a Community domain object', () => {
      const { community } = result as VendorUserRole.VendorUserRole<VendorUserRoleDomainAdapter>;
      expect(community).toBeInstanceOf(CommunityClass);
    });
  });

  Scenario('Converting a domain object to a Mongoose VendorUserRole document', ({ Given, And, When, Then }) => {
    let domainObj: VendorUserRole.VendorUserRole<VendorUserRoleDomainAdapter>;
    let communityAdapter: CommunityDomainAdapter;
    let communityDomainObj: Community.Community<CommunityDomainAdapter>;
    let resultDoc: Models.Role.VendorUserRole;

    Given('a VendorUserRoleConverter instance', () => {
      converter = new VendorUserRoleConverter();
    });
    And('a VendorUserRole domain object with roleName "New Role", isDefault false, and valid community', () => {
      communityAdapter = new CommunityDomainAdapter(communityDoc);
      communityDomainObj = new CommunityClass(communityAdapter, passport);

      const roleDoc = makeVendorUserRoleDoc({
        roleName: 'New Role',
        isDefault: false,
        community: communityDoc,
      });
      const adapter = new VendorUserRoleDomainAdapter(roleDoc);
      adapter.community = communityDomainObj;
      domainObj = new VendorUserRoleClass(adapter, passport);
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