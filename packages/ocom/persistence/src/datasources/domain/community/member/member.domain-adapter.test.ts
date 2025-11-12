import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import type { Passport } from '@ocom/domain';
import type { Models } from '@ocom/data-sources-mongoose-models';
import {
  MemberConverter,
  MemberDomainAdapter,
  MemberAccountDomainAdapter,
  MemberCustomViewDomainAdapter,
  MemberProfileDomainAdapter
} from './member.domain-adapter.ts';
import { CommunityDomainAdapter } from '../community/community.domain-adapter.ts';
import { EndUserRoleDomainAdapter } from '../role/end-user-role/end-user-role.domain-adapter.ts';
import { EndUserDomainAdapter } from '../../user/end-user/end-user.domain-adapter.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const domainAdapterFeature = await loadFeature(
  path.resolve(__dirname, 'features/member.domain-adapter.feature')
);
const typeConverterFeature = await loadFeature(
  path.resolve(__dirname, 'features/member.type-converter.feature')
);

function makeMemberDoc(overrides: Partial<Models.Member.Member> = {}) {
  const base = {
    memberName: 'Test Member',
    cybersourceCustomerId: 'test-customer-id',
    community: undefined,
    role: undefined,
    profile: undefined,
    accounts: [],
    customViews: [],
    set(key: keyof Models.Member.Member, value: unknown) {
      // Type-safe property assignment
      (this as Models.Member.Member)[key] = value as never;
    },
    ...overrides,
  } as Models.Member.Member;
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

function makeEndUserRoleDoc(overrides: Partial<Models.Role.EndUserRole> = {}) {
  const base = {
    id: '6898b0c34b4a2fbc01e9c698',
    roleName: 'Test Role',
    ...overrides,
  } as Models.Role.EndUserRole;
  return vi.mocked(base);
}

function makeMemberAccountDoc(overrides: Partial<Models.Member.MemberAccount> = {}) {
  const base = {
    id: '6898b0c34b4a2fbc01e9c698',
    firstName: 'John',
    lastName: 'Doe',
    user: undefined,
    statusCode: 'active',
    createdBy: undefined,
    set(key: keyof Models.Member.MemberAccount, value: unknown) {
      // Type-safe property assignment
      (this as Models.Member.MemberAccount)[key] = value as never;
    },
    ...overrides,
  } as Models.Member.MemberAccount;
  return vi.mocked(base);
}

function makeMemberCustomViewDoc(overrides: Partial<Models.Member.MemberCustomView> = {}) {
  const base = {
    id: '6898b0c34b4a2fbc01e9c699',
    name: 'My Custom View',
    type: 'list',
    filters: ['status:active'],
    sortOrder: 'asc',
    columnsToDisplay: ['name', 'email', 'status'],
    set(key: keyof Models.Member.MemberCustomView, value: unknown) {
      // Type-safe property assignment
      (this as Models.Member.MemberCustomView)[key] = value as never;
    },
    ...overrides,
  } as Models.Member.MemberCustomView;
  return vi.mocked(base);
}

function makeMemberProfileDoc(overrides: Partial<Models.Member.MemberProfile> = {}) {
  const base = {
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Software developer',
    avatarDocumentId: 'avatar-123',
    interests: ['coding', 'music'],
    showInterests: true,
    showEmail: true,
    showProfile: true,
    showLocation: true,
    showProperties: true,
    set(key: keyof Models.Member.MemberProfile, value: unknown) {
      // Type-safe property assignment
      (this as Models.Member.MemberProfile)[key] = value as never;
    },
    ...overrides,
  } as Models.Member.MemberProfile;
  return vi.mocked(base);
}

function makeUserDoc(overrides: Partial<Models.User.EndUser> = {}) {
  const base = {
    id: '6898b0c34b4a2fbc01e9c697',
    displayName: 'Test User',
    email: 'test@example.com',
    ...overrides,
  } as Models.User.EndUser;
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
  let doc: Models.Member.Member;
  let adapter: MemberDomainAdapter;
  let communityDoc: Models.Community.Community;
  let communityAdapter: CommunityDomainAdapter;
  let roleDoc: Models.Role.EndUserRole;
  let roleAdapter: EndUserRoleDomainAdapter;
  let profileDoc: Models.Member.MemberProfile;
  let result: unknown;

  BeforeEachScenario(() => {
    communityDoc = makeCommunityDoc();
    roleDoc = makeEndUserRoleDoc();
    profileDoc = makeMemberProfileDoc();
    doc = makeMemberDoc({
      community: communityDoc,
      role: roleDoc,
      profile: profileDoc,
    });
    adapter = new MemberDomainAdapter(doc);
    result = undefined;
  });

  Background(({ Given }) => {
    Given(
      'a valid Mongoose Member document with memberName "Test Member", cybersourceCustomerId "test-customer-id", populated community, role, and profile fields',
      () => {
        communityDoc = makeCommunityDoc();
        roleDoc = makeEndUserRoleDoc();
        profileDoc = makeMemberProfileDoc();
        doc = makeMemberDoc({
          community: communityDoc,
          role: roleDoc,
          profile: profileDoc,
        });
        adapter = new MemberDomainAdapter(doc);
      }
    );
  });

  Scenario('Getting and setting the memberName property', ({ Given, When, Then }) => {
    Given('a MemberDomainAdapter for the document', () => {
      adapter = new MemberDomainAdapter(doc);
    });
    When('I get the memberName property', () => {
      result = adapter.memberName;
    });
    Then('it should return "Test Member"', () => {
      expect(result).toBe('Test Member');
    });
    When('I set the memberName property to "New Member Name"', () => {
      adapter.memberName = 'New Member Name';
    });
    Then('the document\'s memberName should be "New Member Name"', () => {
      expect(doc.memberName).toBe('New Member Name');
    });
  });

  Scenario('Getting and setting the cybersourceCustomerId property', ({ Given, When, Then }) => {
    Given('a MemberDomainAdapter for the document', () => {
      adapter = new MemberDomainAdapter(doc);
    });
    When('I get the cybersourceCustomerId property', () => {
      result = adapter.cybersourceCustomerId;
    });
    Then('it should return "test-customer-id"', () => {
      expect(result).toBe('test-customer-id');
    });
    When('I set the cybersourceCustomerId property to "new-customer-id"', () => {
      adapter.cybersourceCustomerId = 'new-customer-id';
    });
    Then('the document\'s cybersourceCustomerId should be "new-customer-id"', () => {
      expect(doc.cybersourceCustomerId).toBe('new-customer-id');
    });
  });

  Scenario('Getting the communityId property', ({ Given, When, Then }) => {
    Given('a MemberDomainAdapter for the document', () => {
      adapter = new MemberDomainAdapter(doc);
    });
    When('I get the communityId property', () => {
      result = adapter.communityId;
    });
    Then('it should return the community\'s id as a string', () => {
      expect(result).toBe(communityDoc.id);
    });
  });

  Scenario('Getting the community property when populated', ({ Given, When, Then }) => {
    Given('a MemberDomainAdapter for the document', () => {
      adapter = new MemberDomainAdapter(doc);
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
    Given('a MemberDomainAdapter for a document with community as an ObjectId', () => {
      doc = makeMemberDoc({ community: new MongooseSeedwork.ObjectId() });
      adapter = new MemberDomainAdapter(doc);
    });
    When('I get the community property', () => {
      gettingCommunityWhenNotPopulated = () => {
        result = adapter.community;
      };
    });
    Then('an error should be thrown indicating "community is not populated or is not of the correct type"', () => {
      expect(gettingCommunityWhenNotPopulated).toThrow();
      expect(gettingCommunityWhenNotPopulated).throws(/community is not populated or is not of the correct type/);
    });
  });

  Scenario('Setting the community property with a valid Community domain object', ({ Given, And, When, Then }) => {
    let communityAdapter: CommunityDomainAdapter;
    let communityDomainObj: Domain.Contexts.Community.Community.Community<CommunityDomainAdapter>;
    Given('a MemberDomainAdapter for the document', () => {
      adapter = new MemberDomainAdapter(doc);
    });
    And('a valid Community domain object', () => {
      communityAdapter = new CommunityDomainAdapter(communityDoc);
      communityDomainObj = new Domain.Contexts.Community.Community.Community(communityAdapter, makeMockPassport());
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
    Given('a MemberDomainAdapter for the document', () => {
      adapter = new MemberDomainAdapter(doc);
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

  Scenario('Getting the role property when populated', ({ Given, When, Then }) => {
    Given('a MemberDomainAdapter for the document', () => {
      adapter = new MemberDomainAdapter(doc);
    });
    When('I get the role property', () => {
      result = adapter.role;
    });
    Then('it should return an EndUserRoleDomainAdapter instance with the correct role data', () => {
      expect(result).toBeInstanceOf(EndUserRoleDomainAdapter);
      expect((result as EndUserRoleDomainAdapter).doc).toBe(roleDoc);
    });
  });

  Scenario('Getting the role property when not populated', ({ Given, When, Then }) => {
    let gettingRoleWhenNotPopulated: () => void;
    Given('a MemberDomainAdapter for a document with role as an ObjectId', () => {
      doc = makeMemberDoc({ role: new MongooseSeedwork.ObjectId() });
      adapter = new MemberDomainAdapter(doc);
    });
    When('I get the role property', () => {
      gettingRoleWhenNotPopulated = () => {
        result = adapter.role;
      };
    });
    Then('an error should be thrown indicating "role is not populated or is not of the correct type"', () => {
      expect(gettingRoleWhenNotPopulated).toThrow();
      expect(gettingRoleWhenNotPopulated).throws(/role is not populated or is not of the correct type/);
    });
  });

  Scenario('Setting the role property with a valid EndUserRole domain object', ({ Given, And, When, Then }) => {
    let roleAdapter: EndUserRoleDomainAdapter;
    let roleDomainObj: Domain.Contexts.Community.Role.EndUserRole.EndUserRole<EndUserRoleDomainAdapter>;
    Given('a MemberDomainAdapter for the document', () => {
      adapter = new MemberDomainAdapter(doc);
    });
    And('a valid EndUserRole domain object', () => {
      roleAdapter = new EndUserRoleDomainAdapter(roleDoc);
      roleDomainObj = new Domain.Contexts.Community.Role.EndUserRole.EndUserRole(roleAdapter, makeMockPassport());
    });
    When('I set the role property to the EndUserRole domain object', () => {
      adapter.role = roleDomainObj;
    });
    Then('the document\'s role should be set to the role\'s doc', () => {
      expect(doc.role).toBe(roleDoc);
    });
  });

  Scenario('Setting the role property with an invalid value', ({ Given, And, When, Then }) => {
    let settingRoleWithInvalidValue: () => void;
    Given('a MemberDomainAdapter for the document', () => {
      adapter = new MemberDomainAdapter(doc);
    });
    And('an object that is not an EndUserRole domain object', () => {
      roleAdapter = {} as EndUserRoleDomainAdapter;
    });
    When('I try to set the role property to the invalid object', () => {
      settingRoleWithInvalidValue = () => {
        adapter.role = roleAdapter;
      };
    });
    Then('an error should be thrown indicating "role reference is missing id"', () => {
      expect(settingRoleWithInvalidValue).toThrow();
      expect(settingRoleWithInvalidValue).throws(/role reference is missing id/);
    });
  });

  Scenario('Getting the profile property', ({ Given, When, Then }) => {
    Given('a MemberDomainAdapter for the document', () => {
      adapter = new MemberDomainAdapter(doc);
    });
    When('I get the profile property', () => {
      result = adapter.profile;
    });
    Then('it should return a MemberProfileDomainAdapter instance', () => {
      expect(result).toBeInstanceOf(MemberProfileDomainAdapter);
    });
  });

  Scenario('Getting the accounts property', ({ Given, When, Then }) => {
    Given('a MemberDomainAdapter for the document', () => {
      adapter = new MemberDomainAdapter(doc);
    });
    When('I get the accounts property', () => {
      result = adapter.accounts;
    });
    Then('it should return a MongoosePropArray of MemberAccount references', () => {
      expect(result).toBeInstanceOf(MongooseSeedwork.MongoosePropArray);
    });
  });

  Scenario('Getting the customViews property', ({ Given, When, Then }) => {
    Given('a MemberDomainAdapter for the document', () => {
      adapter = new MemberDomainAdapter(doc);
    });
    When('I get the customViews property', () => {
      result = adapter.customViews;
    });
    Then('it should return a MongoosePropArray of MemberCustomView references', () => {
      expect(result).toBeInstanceOf(MongooseSeedwork.MongoosePropArray);
    });
  });

  Scenario('MemberAccountDomainAdapter getting and setting firstName property', ({ Given, When, Then }) => {
    let accountDoc: Models.Member.MemberAccount;
    let accountAdapter: MemberAccountDomainAdapter;

    Given('a MemberAccountDomainAdapter for a member account document', () => {
      accountDoc = makeMemberAccountDoc();
      accountAdapter = new MemberAccountDomainAdapter(accountDoc);
    });
    When('I get the firstName property', () => {
      result = accountAdapter.firstName;
    });
    Then('it should return "John"', () => {
      expect(result).toBe('John');
    });
    When('I set the firstName property to "Jane"', () => {
      accountAdapter.firstName = 'Jane';
    });
    Then('the document\'s firstName should be "Jane"', () => {
      expect(accountDoc.firstName).toBe('Jane');
    });
  });

  Scenario('MemberAccountDomainAdapter getting and setting lastName property', ({ Given, When, Then }) => {
    let accountDoc: Models.Member.MemberAccount;
    let accountAdapter: MemberAccountDomainAdapter;

    Given('a MemberAccountDomainAdapter for a member account document', () => {
      accountDoc = makeMemberAccountDoc();
      accountAdapter = new MemberAccountDomainAdapter(accountDoc);
    });
    When('I get the lastName property', () => {
      result = accountAdapter.lastName;
    });
    Then('it should return "Doe"', () => {
      expect(result).toBe('Doe');
    });
    When('I set the lastName property to "Smith"', () => {
      accountAdapter.lastName = 'Smith';
    });
    Then('the document\'s lastName should be "Smith"', () => {
      expect(accountDoc.lastName).toBe('Smith');
    });
  });

  Scenario('MemberAccountDomainAdapter getting user property when populated', ({ Given, When, Then }) => {
    let accountDoc: Models.Member.MemberAccount;
    let accountAdapter: MemberAccountDomainAdapter;
    let userDoc: Models.User.EndUser;

    Given('a MemberAccountDomainAdapter for a member account document with populated user', () => {
      userDoc = makeUserDoc();
      accountDoc = makeMemberAccountDoc({ user: userDoc });
      accountAdapter = new MemberAccountDomainAdapter(accountDoc);
    });
    When('I get the user property', () => {
      result = accountAdapter.user;
    });
    Then('it should return an EndUserDomainAdapter instance with the correct user data', () => {
      expect(result).toBeInstanceOf(EndUserDomainAdapter);
      expect((result as EndUserDomainAdapter).doc).toBe(userDoc);
    });
  });

  Scenario('MemberAccountDomainAdapter setting user property with valid EndUser domain object', ({ Given, And, When, Then }) => {
    let accountDoc: Models.Member.MemberAccount;
    let accountAdapter: MemberAccountDomainAdapter;
    let userAdapter: EndUserDomainAdapter;
    let userDomainObj: Domain.Contexts.User.EndUser.EndUser<EndUserDomainAdapter>;

    Given('a MemberAccountDomainAdapter for a member account document', () => {
      accountDoc = makeMemberAccountDoc();
      accountAdapter = new MemberAccountDomainAdapter(accountDoc);
    });
    And('a valid EndUser domain object', () => {
      const userDoc = makeUserDoc();
      userAdapter = new EndUserDomainAdapter(userDoc);
      userDomainObj = new Domain.Contexts.User.EndUser.EndUser(userAdapter, makeMockPassport());
    });
    When('I set the user property to the EndUser domain object', () => {
      accountAdapter.user = userDomainObj;
    });
    Then('the document\'s user should be set to the user\'s doc', () => {
      expect(accountDoc.user).toBe(userAdapter.doc);
    });
  });

  Scenario('MemberAccountDomainAdapter getting and setting statusCode property', ({ Given, When, Then }) => {
    let accountDoc: Models.Member.MemberAccount;
    let accountAdapter: MemberAccountDomainAdapter;

    Given('a MemberAccountDomainAdapter for a member account document', () => {
      accountDoc = makeMemberAccountDoc();
      accountAdapter = new MemberAccountDomainAdapter(accountDoc);
    });
    When('I get the statusCode property', () => {
      result = accountAdapter.statusCode;
    });
    Then('it should return "active"', () => {
      expect(result).toBe('active');
    });
    When('I set the statusCode property to "inactive"', () => {
      accountAdapter.statusCode = 'inactive';
    });
    Then('the document\'s statusCode should be "inactive"', () => {
      expect(accountDoc.statusCode).toBe('inactive');
    });
  });

  Scenario('MemberAccountDomainAdapter getting createdBy property when populated', ({ Given, When, Then }) => {
    let accountDoc: Models.Member.MemberAccount;
    let accountAdapter: MemberAccountDomainAdapter;
    let userDoc: Models.User.EndUser;

    Given('a MemberAccountDomainAdapter for a member account document with populated createdBy', () => {
      userDoc = makeUserDoc();
      accountDoc = makeMemberAccountDoc({ createdBy: userDoc });
      accountAdapter = new MemberAccountDomainAdapter(accountDoc);
    });
    When('I get the createdBy property', () => {
      result = accountAdapter.createdBy;
    });
    Then('it should return an EndUserDomainAdapter instance with the correct user data', () => {
      expect(result).toBeInstanceOf(EndUserDomainAdapter);
      expect((result as EndUserDomainAdapter).doc).toBe(userDoc);
    });
  });

  Scenario('MemberAccountDomainAdapter setting createdBy property with valid EndUser domain object', ({ Given, And, When, Then }) => {
    let accountDoc: Models.Member.MemberAccount;
    let accountAdapter: MemberAccountDomainAdapter;
    let userAdapter: EndUserDomainAdapter;
    let userDomainObj: Domain.Contexts.User.EndUser.EndUser<EndUserDomainAdapter>;

    Given('a MemberAccountDomainAdapter for a member account document', () => {
      accountDoc = makeMemberAccountDoc();
      accountAdapter = new MemberAccountDomainAdapter(accountDoc);
    });
    And('a valid EndUser domain object', () => {
      const userDoc = makeUserDoc();
      userAdapter = new EndUserDomainAdapter(userDoc);
      userDomainObj = new Domain.Contexts.User.EndUser.EndUser(userAdapter, makeMockPassport());
    });
    When('I set the createdBy property to the EndUser domain object', () => {
      accountAdapter.createdBy = userDomainObj;
    });
    Then('the document\'s createdBy should be set to the user\'s doc', () => {
      expect(accountDoc.createdBy).toBe(userAdapter.doc);
    });
  });

  Scenario('MemberCustomViewDomainAdapter getting and setting name property', ({ Given, When, Then }) => {
    let viewDoc: Models.Member.MemberCustomView;
    let viewAdapter: MemberCustomViewDomainAdapter;

    Given('a MemberCustomViewDomainAdapter for a custom view document', () => {
      viewDoc = makeMemberCustomViewDoc();
      viewAdapter = new MemberCustomViewDomainAdapter(viewDoc);
    });
    When('I get the name property', () => {
      result = viewAdapter.name;
    });
    Then('it should return "My Custom View"', () => {
      expect(result).toBe('My Custom View');
    });
    When('I set the name property to "Updated View"', () => {
      viewAdapter.name = 'Updated View';
    });
    Then('the document\'s name should be "Updated View"', () => {
      expect(viewDoc.name).toBe('Updated View');
    });
  });

  Scenario('MemberCustomViewDomainAdapter getting and setting type property', ({ Given, When, Then }) => {
    let viewDoc: Models.Member.MemberCustomView;
    let viewAdapter: MemberCustomViewDomainAdapter;

    Given('a MemberCustomViewDomainAdapter for a custom view document', () => {
      viewDoc = makeMemberCustomViewDoc();
      viewAdapter = new MemberCustomViewDomainAdapter(viewDoc);
    });
    When('I get the type property', () => {
      result = viewAdapter.type;
    });
    Then('it should return "list"', () => {
      expect(result).toBe('list');
    });
    When('I set the type property to "grid"', () => {
      viewAdapter.type = 'grid';
    });
    Then('the document\'s type should be "grid"', () => {
      expect(viewDoc.type).toBe('grid');
    });
  });

  Scenario('MemberCustomViewDomainAdapter getting and setting filters property', ({ Given, When, Then }) => {
    let viewDoc: Models.Member.MemberCustomView;
    let viewAdapter: MemberCustomViewDomainAdapter;
    const expectedFilters = ['status:active'];
    const newFilters = ['status:inactive', 'priority:high'];

    Given('a MemberCustomViewDomainAdapter for a custom view document', () => {
      viewDoc = makeMemberCustomViewDoc();
      viewAdapter = new MemberCustomViewDomainAdapter(viewDoc);
    });
    When('I get the filters property', () => {
      result = viewAdapter.filters;
    });
    Then('it should return the expected filters object', () => {
      expect(result).toEqual(expectedFilters);
    });
    When('I set the filters property to a new filters object', () => {
      viewAdapter.filters = newFilters;
    });
    Then('the document\'s filters should be updated', () => {
      expect(viewDoc.filters).toEqual(newFilters);
    });
  });

  Scenario('MemberCustomViewDomainAdapter getting and setting sortOrder property', ({ Given, When, Then }) => {
    let viewDoc: Models.Member.MemberCustomView;
    let viewAdapter: MemberCustomViewDomainAdapter;

    Given('a MemberCustomViewDomainAdapter for a custom view document', () => {
      viewDoc = makeMemberCustomViewDoc();
      viewAdapter = new MemberCustomViewDomainAdapter(viewDoc);
    });
    When('I get the sortOrder property', () => {
      result = viewAdapter.sortOrder;
    });
    Then('it should return "asc"', () => {
      expect(result).toBe('asc');
    });
    When('I set the sortOrder property to "desc"', () => {
      viewAdapter.sortOrder = 'desc';
    });
    Then('the document\'s sortOrder should be "desc"', () => {
      expect(viewDoc.sortOrder).toBe('desc');
    });
  });

  Scenario('MemberCustomViewDomainAdapter getting and setting columnsToDisplay property', ({ Given, When, Then }) => {
    let viewDoc: Models.Member.MemberCustomView;
    let viewAdapter: MemberCustomViewDomainAdapter;
    const expectedColumns = ['name', 'email', 'status'];
    const newColumns = ['name', 'email', 'status', 'priority'];

    Given('a MemberCustomViewDomainAdapter for a custom view document', () => {
      viewDoc = makeMemberCustomViewDoc();
      viewAdapter = new MemberCustomViewDomainAdapter(viewDoc);
    });
    When('I get the columnsToDisplay property', () => {
      result = viewAdapter.columnsToDisplay;
    });
    Then('it should return the expected columns array', () => {
      expect(result).toEqual(expectedColumns);
    });
    When('I set the columnsToDisplay property to a new columns array', () => {
      viewAdapter.columnsToDisplay = newColumns;
    });
    Then('the document\'s columnsToDisplay should be updated', () => {
      expect(viewDoc.columnsToDisplay).toEqual(newColumns);
    });
  });

  Scenario('MemberProfileDomainAdapter getting and setting name property', ({ Given, When, Then }) => {
    let profileDoc: Models.Member.MemberProfile;
    let profileAdapter: MemberProfileDomainAdapter;

    Given('a MemberProfileDomainAdapter for a profile document', () => {
      profileDoc = makeMemberProfileDoc();
      profileAdapter = new MemberProfileDomainAdapter(profileDoc);
    });
    When('I get the name property', () => {
      result = profileAdapter.name;
    });
    Then('it should return "John Doe"', () => {
      expect(result).toBe('John Doe');
    });
    When('I set the name property to "Jane Smith"', () => {
      profileAdapter.name = 'Jane Smith';
    });
    Then('the document\'s name should be "Jane Smith"', () => {
      expect(profileDoc.name).toBe('Jane Smith');
    });
  });

  Scenario('MemberProfileDomainAdapter getting and setting email property', ({ Given, When, Then }) => {
    let profileDoc: Models.Member.MemberProfile;
    let profileAdapter: MemberProfileDomainAdapter;

    Given('a MemberProfileDomainAdapter for a profile document', () => {
      profileDoc = makeMemberProfileDoc();
      profileAdapter = new MemberProfileDomainAdapter(profileDoc);
    });
    When('I get the email property', () => {
      result = profileAdapter.email;
    });
    Then('it should return "john@example.com"', () => {
      expect(result).toBe('john@example.com');
    });
    When('I set the email property to "jane@example.com"', () => {
      profileAdapter.email = 'jane@example.com';
    });
    Then('the document\'s email should be "jane@example.com"', () => {
      expect(profileDoc.email).toBe('jane@example.com');
    });
  });

  Scenario('MemberProfileDomainAdapter getting and setting bio property', ({ Given, When, Then }) => {
    let profileDoc: Models.Member.MemberProfile;
    let profileAdapter: MemberProfileDomainAdapter;

    Given('a MemberProfileDomainAdapter for a profile document', () => {
      profileDoc = makeMemberProfileDoc();
      profileAdapter = new MemberProfileDomainAdapter(profileDoc);
    });
    When('I get the bio property', () => {
      result = profileAdapter.bio;
    });
    Then('it should return "Software developer"', () => {
      expect(result).toBe('Software developer');
    });
    When('I set the bio property to "Product manager"', () => {
      profileAdapter.bio = 'Product manager';
    });
    Then('the document\'s bio should be "Product manager"', () => {
      expect(profileDoc.bio).toBe('Product manager');
    });
  });

  Scenario('MemberProfileDomainAdapter getting and setting avatarDocumentId property', ({ Given, When, Then }) => {
    let profileDoc: Models.Member.MemberProfile;
    let profileAdapter: MemberProfileDomainAdapter;

    Given('a MemberProfileDomainAdapter for a profile document', () => {
      profileDoc = makeMemberProfileDoc();
      profileAdapter = new MemberProfileDomainAdapter(profileDoc);
    });
    When('I get the avatarDocumentId property', () => {
      result = profileAdapter.avatarDocumentId;
    });
    Then('it should return "avatar-123"', () => {
      expect(result).toBe('avatar-123');
    });
    When('I set the avatarDocumentId property to "avatar-456"', () => {
      profileAdapter.avatarDocumentId = 'avatar-456';
    });
    Then('the document\'s avatarDocumentId should be "avatar-456"', () => {
      expect(profileDoc.avatarDocumentId).toBe('avatar-456');
    });
  });

  Scenario('MemberProfileDomainAdapter getting and setting interests property', ({ Given, When, Then }) => {
    let profileDoc: Models.Member.MemberProfile;
    let profileAdapter: MemberProfileDomainAdapter;
    const expectedInterests = ['coding', 'music'];
    const newInterests = ['coding', 'music', 'art'];

    Given('a MemberProfileDomainAdapter for a profile document', () => {
      profileDoc = makeMemberProfileDoc();
      profileAdapter = new MemberProfileDomainAdapter(profileDoc);
    });
    When('I get the interests property', () => {
      result = profileAdapter.interests;
    });
    Then('it should return the expected interests array', () => {
      expect(result).toEqual(expectedInterests);
    });
    When('I set the interests property to a new interests array', () => {
      profileAdapter.interests = newInterests;
    });
    Then('the document\'s interests should be updated', () => {
      expect(profileDoc.interests).toEqual(newInterests);
    });
  });

  Scenario('MemberProfileDomainAdapter getting and setting showInterests property', ({ Given, When, Then }) => {
    let profileDoc: Models.Member.MemberProfile;
    let profileAdapter: MemberProfileDomainAdapter;

    Given('a MemberProfileDomainAdapter for a profile document', () => {
      profileDoc = makeMemberProfileDoc();
      profileAdapter = new MemberProfileDomainAdapter(profileDoc);
    });
    When('I get the showInterests property', () => {
      result = profileAdapter.showInterests;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the showInterests property to false', () => {
      profileAdapter.showInterests = false;
    });
    Then('the document\'s showInterests should be false', () => {
      expect(profileDoc.showInterests).toBe(false);
    });
  });

  Scenario('MemberProfileDomainAdapter getting and setting showEmail property', ({ Given, When, Then }) => {
    let profileDoc: Models.Member.MemberProfile;
    let profileAdapter: MemberProfileDomainAdapter;

    Given('a MemberProfileDomainAdapter for a profile document', () => {
      profileDoc = makeMemberProfileDoc();
      profileAdapter = new MemberProfileDomainAdapter(profileDoc);
    });
    When('I get the showEmail property', () => {
      result = profileAdapter.showEmail;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the showEmail property to false', () => {
      profileAdapter.showEmail = false;
    });
    Then('the document\'s showEmail should be false', () => {
      expect(profileDoc.showEmail).toBe(false);
    });
  });

  Scenario('MemberProfileDomainAdapter getting and setting showProfile property', ({ Given, When, Then }) => {
    let profileDoc: Models.Member.MemberProfile;
    let profileAdapter: MemberProfileDomainAdapter;

    Given('a MemberProfileDomainAdapter for a profile document', () => {
      profileDoc = makeMemberProfileDoc();
      profileAdapter = new MemberProfileDomainAdapter(profileDoc);
    });
    When('I get the showProfile property', () => {
      result = profileAdapter.showProfile;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the showProfile property to false', () => {
      profileAdapter.showProfile = false;
    });
    Then('the document\'s showProfile should be false', () => {
      expect(profileDoc.showProfile).toBe(false);
    });
  });

  Scenario('MemberProfileDomainAdapter getting and setting showLocation property', ({ Given, When, Then }) => {
    let profileDoc: Models.Member.MemberProfile;
    let profileAdapter: MemberProfileDomainAdapter;

    Given('a MemberProfileDomainAdapter for a profile document', () => {
      profileDoc = makeMemberProfileDoc();
      profileAdapter = new MemberProfileDomainAdapter(profileDoc);
    });
    When('I get the showLocation property', () => {
      result = profileAdapter.showLocation;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the showLocation property to false', () => {
      profileAdapter.showLocation = false;
    });
    Then('the document\'s showLocation should be false', () => {
      expect(profileDoc.showLocation).toBe(false);
    });
  });

  Scenario('MemberProfileDomainAdapter getting and setting showProperties property', ({ Given, When, Then }) => {
    let profileDoc: Models.Member.MemberProfile;
    let profileAdapter: MemberProfileDomainAdapter;

    Given('a MemberProfileDomainAdapter for a profile document', () => {
      profileDoc = makeMemberProfileDoc();
      profileAdapter = new MemberProfileDomainAdapter(profileDoc);
    });
    When('I get the showProperties property', () => {
      result = profileAdapter.showProperties;
    });
    Then('it should return true', () => {
      expect(result).toBe(true);
    });
    When('I set the showProperties property to false', () => {
      profileAdapter.showProperties = false;
    });
    Then('the document\'s showProperties should be false', () => {
      expect(profileDoc.showProperties).toBe(false);
    });
  });
});

test.for(typeConverterFeature, ({ Scenario, Background, BeforeEachScenario }) => {
  let doc: Models.Member.Member;
  let communityDoc: Models.Community.Community;
  let roleDoc: Models.Role.EndUserRole;
  let profileDoc: Models.Member.MemberProfile;
  let converter: MemberConverter;
  let passport: Passport;
  let result: unknown;

  BeforeEachScenario(() => {
    communityDoc = makeCommunityDoc();
    roleDoc = makeEndUserRoleDoc();
    profileDoc = makeMemberProfileDoc();
    doc = makeMemberDoc({
      community: communityDoc,
      role: roleDoc,
      profile: profileDoc,
    });
    converter = new MemberConverter();
    passport = makeMockPassport();
    result = undefined;
  });

  Background(({ Given }) => {
    Given(
      'a valid Mongoose Member document with memberName "Test Member", cybersourceCustomerId "test-customer-id", populated community, role, and profile fields',
      () => {
        communityDoc = makeCommunityDoc();
        roleDoc = makeEndUserRoleDoc();
        profileDoc = makeMemberProfileDoc();
        doc = makeMemberDoc({
          community: communityDoc,
          role: roleDoc,
          profile: profileDoc,
        });
      }
    );
  });

  Scenario('Converting a Mongoose Member document to a domain object', ({ Given, When, Then, And }) => {
    Given('a MemberConverter instance', () => {
      converter = new MemberConverter();
    });
    When('I call toDomain with the Mongoose Member document', () => {
      result = converter.toDomain(doc, passport);
    });
    Then('I should receive a Member domain object', () => {
      expect(result).toBeInstanceOf(Domain.Contexts.Community.Member.Member);
    });
    And('the domain object\'s memberName should be "Test Member"', () => {
      expect((result as Domain.Contexts.Community.Member.Member<MemberDomainAdapter>).memberName).toBe('Test Member');
    });
    And('the domain object\'s cybersourceCustomerId should be "test-customer-id"', () => {
      expect((result as Domain.Contexts.Community.Member.Member<MemberDomainAdapter>).cybersourceCustomerId).toBe('test-customer-id');
    });
    And('the domain object\'s community should be a Community domain object', () => {
      const { community } = result as Domain.Contexts.Community.Member.Member<MemberDomainAdapter>;
      expect(community).toBeInstanceOf(Domain.Contexts.Community.Community.Community);
    });
    And('the domain object\'s role should be an EndUserRole domain object', () => {
      const { role } = result as Domain.Contexts.Community.Member.Member<MemberDomainAdapter>;
      expect(role).toBeInstanceOf(Domain.Contexts.Community.Role.EndUserRole.EndUserRole);
    });
    And('the domain object\'s profile should be a MemberProfile domain object', () => {
      const { profile } = result as Domain.Contexts.Community.Member.Member<MemberDomainAdapter>;
      expect(profile).toBeDefined();
    });
  });

  Scenario('Converting a domain object to a Mongoose Member document', ({ Given, And, When, Then }) => {
    let domainObj: Domain.Contexts.Community.Member.Member<MemberDomainAdapter>;
    let communityAdapter: CommunityDomainAdapter;
    let roleAdapter: EndUserRoleDomainAdapter;
    let communityDomainObj: Domain.Contexts.Community.Community.Community<CommunityDomainAdapter>;
    let roleDomainObj: Domain.Contexts.Community.Role.EndUserRole.EndUserRole<EndUserRoleDomainAdapter>;
    let resultDoc: Models.Member.Member;

    Given('a MemberConverter instance', () => {
      converter = new MemberConverter();
    });
    And('a Member domain object with memberName "New Member", cybersourceCustomerId "new-customer-id", and valid community, role, and profile', () => {
      communityAdapter = new CommunityDomainAdapter(communityDoc);
      roleAdapter = new EndUserRoleDomainAdapter(roleDoc);
      communityDomainObj = new Domain.Contexts.Community.Community.Community(communityAdapter, passport);
      roleDomainObj = new Domain.Contexts.Community.Role.EndUserRole.EndUserRole(roleAdapter, passport);

      const memberDoc = makeMemberDoc({
        memberName: 'New Member',
        cybersourceCustomerId: 'new-customer-id',
        community: communityDoc,
        role: roleDoc,
        profile: profileDoc,
      });
      const adapter = new MemberDomainAdapter(memberDoc);
      adapter.community = communityDomainObj;
      adapter.role = roleDomainObj;
      domainObj = new Domain.Contexts.Community.Member.Member(adapter, passport);
    });
    When('I call toPersistence with the Member domain object', () => {
      resultDoc = converter.toPersistence(domainObj);
    });
    Then('I should receive a Mongoose Member document', () => {
      expect(resultDoc).toBeDefined();
      expect(resultDoc).toHaveProperty('memberName');
    });
    And('the document\'s memberName should be "New Member"', () => {
      expect(resultDoc.memberName).toBe('New Member');
    });
    And('the document\'s cybersourceCustomerId should be "new-customer-id"', () => {
      expect(resultDoc.cybersourceCustomerId).toBe('new-customer-id');
    });
    And('the document\'s community should be set to the correct community document', () => {
      expect(resultDoc.community).toBe(communityDoc);
    });
    And('the document\'s role should be set to the correct role document', () => {
      expect(resultDoc.role).toBe(roleDoc);
    });
    And('the document\'s profile should be set to the correct profile document', () => {
      expect(resultDoc.profile).toBe(profileDoc);
    });
  });
});