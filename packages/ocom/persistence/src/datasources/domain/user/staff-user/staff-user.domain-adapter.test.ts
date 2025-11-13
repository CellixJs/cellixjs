import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Passport } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { StaffRoleDomainAdapter } from '../staff-role/staff-role.domain-adapter.ts';
import { StaffUserDomainAdapter } from './staff-user.domain-adapter.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/staff-user.domain-adapter.feature')
);

function makeStaffUserDoc(overrides: Partial<Models.User.StaffUser> = {}) {
  const base = {
    id: '507f1f77bcf86cd799439011',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    displayName: 'John Doe',
    externalId: '12345678-1234-1234-1234-123456789012',
    accessBlocked: false,
    tags: [],
    role: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    schemaVersion: '1.0.0',
    set(key: keyof Models.User.StaffUser, value: unknown) {
      (this as Models.User.StaffUser)[key] = value as never;
    },
    ...overrides,
  } as Models.User.StaffUser;
  return vi.mocked(base);
}

function makeStaffRoleDoc(overrides: Partial<Models.Role.StaffRole> = {}) {
  return {
    id: '507f1f77bcf86cd799439012',
    roleName: 'Admin',
    isDefault: false,
    permissions: {
      communityPermissions: {
        canManageStaffRolesAndPermissions: true,
        canManageAllCommunities: true,
        canDeleteCommunities: false,
        canChangeCommunityOwner: false,
        canReIndexSearchCollections: false,
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
    roleType: 'admin',
    ...overrides,
  } as Models.Role.StaffRole;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let adapter: StaffUserDomainAdapter;
  let doc: Models.User.StaffUser;

  BeforeEachScenario(() => {
    doc = makeStaffUserDoc();
    adapter = new StaffUserDomainAdapter(doc);
  });

  Background(({ Given }) => {
    Given(
      'a valid Mongoose StaffUser document with firstName "John", lastName "Doe", email "john.doe@example.com", displayName "John Doe", externalId "12345678-1234-1234-1234-123456789012", accessBlocked false',
      () => {
        doc = makeStaffUserDoc({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          displayName: 'John Doe',
          externalId: '12345678-1234-1234-1234-123456789012',
          accessBlocked: false,
          tags: [],
        });
        adapter = new StaffUserDomainAdapter(doc);
      }
    );
  });

  Scenario('Getting and setting the role property', ({ Given, When, Then }) => {
    Given('a StaffUserDomainAdapter for the document', () => {
      // Already set up
    });
    When('I get the role property', () => {
      // Test will check the value
    });
    Then('it should return undefined', () => {
      expect(adapter.role).toBeUndefined();
    });
    When('I set the role reference to a valid role', () => {
      const roleRef = { id: '507f1f77bcf86cd799439012' } as StaffRoleEntityReference;
      adapter.setRoleRef(roleRef);
    });
    Then('the document\'s role should be set to the ObjectId', () => {
      expect(doc.role).toEqual(new MongooseSeedwork.ObjectId('507f1f77bcf86cd799439012'));
    });
  });

  Scenario('Setting role reference to undefined', ({ Given, When, Then }) => {
    Given('a StaffUserDomainAdapter for the document', () => {
      // Already set up
    });
    When('I set the role reference to undefined', () => {
      adapter.setRoleRef(undefined);
    });
    Then('the document\'s role should be undefined', () => {
      expect(doc.role).toBeUndefined();
    });
  });

  Scenario('Getting and setting the firstName property', ({ Given, When, Then }) => {
    Given('a StaffUserDomainAdapter for the document', () => {
      // Already set up
    });
    When('I get the firstName property', () => {
      // Test will check the value
    });
    Then('it should return "John"', () => {
      expect(adapter.firstName).toBe('John');
    });
    When('I set the firstName property to "Jane"', () => {
      adapter.firstName = 'Jane';
    });
    Then('the document\'s firstName should be "Jane"', () => {
      expect(doc.firstName).toBe('Jane');
    });
  });

  Scenario('Getting and setting the lastName property', ({ Given, When, Then }) => {
    Given('a StaffUserDomainAdapter for the document', () => {
      // Already set up
    });
    When('I get the lastName property', () => {
      // Test will check the value
    });
    Then('it should return "Doe"', () => {
      expect(adapter.lastName).toBe('Doe');
    });
    When('I set the lastName property to "Smith"', () => {
      adapter.lastName = 'Smith';
    });
    Then('the document\'s lastName should be "Smith"', () => {
      expect(doc.lastName).toBe('Smith');
    });
  });

  Scenario('Getting and setting the email property', ({ Given, When, Then }) => {
    Given('a StaffUserDomainAdapter for the document', () => {
      // Already set up
    });
    When('I get the email property', () => {
      // Test will check the value
    });
    Then('it should return "john.doe@example.com"', () => {
      expect(adapter.email).toBe('john.doe@example.com');
    });
    When('I set the email property to "jane.smith@example.com"', () => {
      adapter.email = 'jane.smith@example.com';
    });
    Then('the document\'s email should be "jane.smith@example.com"', () => {
      expect(doc.email).toBe('jane.smith@example.com');
    });
  });

  Scenario('Getting and setting the displayName property', ({ Given, When, Then }) => {
    Given('a StaffUserDomainAdapter for the document', () => {
      // Already set up
    });
    When('I get the displayName property', () => {
      // Test will check the value
    });
    Then('it should return "John Doe"', () => {
      expect(adapter.displayName).toBe('John Doe');
    });
    When('I set the displayName property to "Jane Smith"', () => {
      adapter.displayName = 'Jane Smith';
    });
    Then('the document\'s displayName should be "Jane Smith"', () => {
      expect(doc.displayName).toBe('Jane Smith');
    });
  });

  Scenario('Getting and setting the externalId property', ({ Given, When, Then }) => {
    Given('a StaffUserDomainAdapter for the document', () => {
      // Already set up
    });
    When('I get the externalId property', () => {
      // Test will check the value
    });
    Then('it should return "12345678-1234-1234-1234-123456789012"', () => {
      expect(adapter.externalId).toBe('12345678-1234-1234-1234-123456789012');
    });
    When('I set the externalId property to "87654321-4321-4321-4321-210987654321"', () => {
      adapter.externalId = '87654321-4321-4321-4321-210987654321';
    });
    Then('the document\'s externalId should be "87654321-4321-4321-4321-210987654321"', () => {
      expect(doc.externalId).toBe('87654321-4321-4321-4321-210987654321');
    });
  });

  Scenario('Getting and setting the accessBlocked property', ({ Given, When, Then }) => {
    Given('a StaffUserDomainAdapter for the document', () => {
      // Already set up
    });
    When('I get the accessBlocked property', () => {
      // Test will check the value
    });
    Then('it should return false', () => {
      expect(adapter.accessBlocked).toBe(false);
    });
    When('I set the accessBlocked property to true', () => {
      adapter.accessBlocked = true;
    });
    Then('the document\'s accessBlocked should be true', () => {
      expect(doc.accessBlocked).toBe(true);
    });
  });

  Scenario('Getting and setting the tags property', ({ Given, When, Then }) => {
    Given('a StaffUserDomainAdapter for the document', () => {
      // Already set up
    });
    When('I get the tags property', () => {
      // Test will check the value
    });
    Then('it should return an empty array', () => {
      expect(adapter.tags).toEqual([]);
    });
    When('I set the tags property to ["admin", "manager"]', () => {
      adapter.tags = ['admin', 'manager'];
    });
    Then('the document\'s tags should be ["admin", "manager"]', () => {
      expect(doc.tags).toEqual(['admin', 'manager']);
    });
  });

  Scenario('Getting readonly properties', ({ Given, When, Then }) => {
    Given('a StaffUserDomainAdapter for the document', () => {
      // Already set up
    });
    When('I get the userType property', () => {
      // Test will check the value
    });
    Then('it should return "staff-user"', () => {
      expect(adapter.userType).toBe('staff-user');
    });
    When('I get the createdAt property', () => {
      // Test will check the value
    });
    Then('it should return a Date for createdAt', () => {
      expect(adapter.createdAt).toBeInstanceOf(Date);
    });
    When('I get the updatedAt property', () => {
      // Test will check the value
    });
    Then('it should return a Date for updatedAt', () => {
      expect(adapter.updatedAt).toBeInstanceOf(Date);
    });
    When('I get the schemaVersion property', () => {
      // Test will check the value
    });
    Then('it should return "1.0.0" for schemaVersion', () => {
      expect(adapter.schemaVersion).toBe('1.0.0');
    });
  });

  Scenario('Getting role when populated', ({ Given, When, Then }) => {
    Given('a StaffUserDomainAdapter for the document with populated role', () => {
      const roleDoc = makeStaffRoleDoc();
      doc.role = roleDoc;
      adapter = new StaffUserDomainAdapter(doc);
    });
    When('I get the role property', () => {
      // Test will check the value
    });
    Then('it should return a StaffRoleProps object', () => {
      const { role } = adapter;
      expect(role).toBeDefined();
      expect(role).toBeInstanceOf(StaffRoleDomainAdapter);
    });
  });

  Scenario('Getting role when role is ObjectId', ({ Given, When, Then }) => {
    Given('a StaffUserDomainAdapter for the document with role as ObjectId', () => {
      doc.role = new MongooseSeedwork.ObjectId('507f1f77bcf86cd799439012');
      adapter = new StaffUserDomainAdapter(doc);
    });
    When('I get the role property', () => {
      // Test will check the value
    });
    Then('the role should be undefined', () => {
      expect(adapter.role).toBeUndefined();
    });
  });
});