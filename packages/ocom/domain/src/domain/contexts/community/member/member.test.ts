
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, vi } from 'vitest';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { CommunityEntityReference, CommunityProps } from '../community/community.ts';
import type { EndUserRoleEntityReference, EndUserRoleProps } from '../role/end-user-role/end-user-role.ts';
import { Member, type MemberProps } from './member.ts';
import { MemberAccount, type MemberAccountProps } from './member-account.ts';
import { MemberCustomView, type MemberCustomViewProps } from './member-custom-view.ts';
import type { MemberProfileProps } from './member-profile.ts';
import type { Passport } from '../../passport.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/member.feature'),
);

function makePassport(overrides: Partial<{ canManageMembers: boolean; isSystemAccount: boolean }> = {}) {
  return vi.mocked({
    community: {
      forCommunity: vi.fn(() => ({
        determineIf: (fn: (p: { canManageMembers: boolean; isSystemAccount: boolean }) => boolean) =>
          fn({
            canManageMembers: overrides.canManageMembers ?? true,
            isSystemAccount: overrides.isSystemAccount ?? false,
          }),
      })),
    },
  } as unknown as Passport);
}

function makeCommunityEntityReference(id = 'community-1'): CommunityEntityReference {
  return vi.mocked({
    id,
    name: 'Test Community',
  } as CommunityProps);
}

function makeRoleEntityReference(id = 'role-1'): EndUserRoleEntityReference {
    return vi.mocked({
        id,
        roleName: 'Member',
        isDefault: false,
    } as EndUserRoleProps);
}

function makeBaseProps(overrides: Partial<MemberProps> = {}): MemberProps {
  const makeAccountProps = (id = 'account-1') => {
    return vi.mocked({
      id,
      lastName: 'Account',
    } as unknown as MemberAccountProps);
  }
  const makeCustomViewProps = (id = 'view-1') => {
    return vi.mocked({
      id,
      name: 'Default View',
      // ...other required fields
    } as unknown as MemberCustomViewProps);
  }
  let _role = makeRoleEntityReference();
  return {
    id: 'member-1',
    memberName: 'Alice',
    cybersourceCustomerId: 'cs_123',
    communityId: 'community-1',
    community: makeCommunityEntityReference(),
    async loadCommunity(): Promise<CommunityEntityReference> {
        return await Promise.resolve(makeCommunityEntityReference());
    },
    accounts: {
      items: [makeAccountProps()],
      getNewItem: () => makeAccountProps('account-2'),
      addItem: vi.fn(),
      removeItem: vi.fn(),
      removeAll: vi.fn(),
    },
    get role() {
        return _role;
    },
    async loadRole(): Promise<EndUserRoleEntityReference> {
        return await Promise.resolve(_role);
    },
    set role(value: EndUserRoleEntityReference) {
        _role = value;
    },
    customViews: {
      items: [makeCustomViewProps()],
      getNewItem: () => makeCustomViewProps('view-2'),
      addItem: vi.fn(),
      removeItem: vi.fn(),
      removeAll: vi.fn(),
    },
    profile: {} as MemberProfileProps,
    createdAt: new Date('2020-01-01T00:00:00Z'),
    updatedAt: new Date('2020-01-02T00:00:00Z'),
    schemaVersion: '1.0.0',
    ...overrides,
  };
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let passport: ReturnType<typeof makePassport>;
  let baseProps: MemberProps;
  let communityRef: CommunityEntityReference;
  let member: Member<MemberProps>;
  let newMember: Member<MemberProps>;

  BeforeEachScenario(() => {
    passport = makePassport();
    communityRef = makeCommunityEntityReference();
    baseProps = makeBaseProps();
    member = new Member(baseProps, passport);
    newMember = undefined as unknown as Member<MemberProps>;
  });

  Background(({ Given, And }) => {
    Given('a valid Passport with community permissions', () => {
      passport = makePassport({ canManageMembers: true });
    });
    And('a valid CommunityEntityReference', () => {
      communityRef = makeCommunityEntityReference();
    });
    And('base member properties with memberName "Alice", cybersourceCustomerId "cs_123", a valid community, at least one account, a valid role, a valid profile, and valid timestamps', () => {
      baseProps = makeBaseProps();
      member = new Member(baseProps, passport);
    });
  });

  Scenario('Creating a new member instance with permission to manage members', ({ Given, When, Then, And }) => {
    Given('a passport with permission to manage members', () => {
      passport = makePassport({ canManageMembers: true, isSystemAccount: false });
    });
    When('I create a new Member aggregate using getNewInstance with memberName "Alice", cybersourceCustomerId "cs_123", and a CommunityEntityReference', () => {
      newMember = Member.getNewInstance(
        makeBaseProps(),
        passport,
        'Alice',
        communityRef
      );
    });
    Then("the member's memberName should be \"Alice\"", () => {
      expect(newMember.memberName).toBe('Alice');
    });
    And("the member's community should reference the provided CommunityEntityReference", () => {
      expect(newMember.community.id).toBe(communityRef.id);
    });
  });

  Scenario('Creating a new member instance with system account permission', ({ Given, When, Then, And }) => {
    Given('a passport with system account permission', () => {
      passport = makePassport({ canManageMembers: false, isSystemAccount: true });
    });
    When('I create a new Member aggregate using getNewInstance with memberName "Alice", cybersourceCustomerId "cs_123", and a CommunityEntityReference', () => {
      newMember = Member.getNewInstance(
        makeBaseProps(),
        passport,
        'Alice',
        communityRef
      );
    });
    Then("the member's memberName should be \"Alice\"", () => {
      expect(newMember.memberName).toBe('Alice');
    });
    And("the member's community should reference the provided CommunityEntityReference", () => {
      expect(newMember.community.id).toBe(communityRef.id);
    });
  });

  Scenario('Creating a new member instance without permission', ({ Given, When, Then }) => {
    let createWithoutPermission: () => void;
    Given('a passport without permission to manage members or system account', () => {
      passport = makePassport({ canManageMembers: false, isSystemAccount: false });
    });
    When('I try to create a new Member aggregate using getNewInstance with memberName "Alice", cybersourceCustomerId "cs_123", and a CommunityEntityReference', () => {
      createWithoutPermission = () => {
        Member.getNewInstance(
          makeBaseProps(),
          passport,
          'Alice',
          communityRef
        );
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(createWithoutPermission).toThrow(DomainSeedwork.PermissionError);
      expect(createWithoutPermission).toThrow('Cannot create new member');
    });
  });

  Scenario('Changing the memberName with permission to manage members', ({ Given, When, Then }) => {
    Given('a Member aggregate with permission to manage members', () => {
      passport = makePassport({ canManageMembers: true });
      member = new Member(makeBaseProps(), passport);
    });
    When('I set the memberName to "Bob"', () => {
      member.memberName = 'Bob';
    });
    Then("the member's memberName should be \"Bob\"", () => {
      expect(member.memberName).toBe('Bob');
    });
  });

  Scenario('Changing the memberName with system account permission', ({ Given, When, Then }) => {
    Given('a Member aggregate with system account permission', () => {
      passport = makePassport({ canManageMembers: false, isSystemAccount: true });
      member = new Member(makeBaseProps(), passport);
    });
    When('I set the memberName to "Bob"', () => {
      member.memberName = 'Bob';
    });
    Then("the member's memberName should be \"Bob\"", () => {
      expect(member.memberName).toBe('Bob');
    });
  });

  Scenario('Changing the memberName without permission', ({ Given, When, Then }) => {
    let changeMemberNameWithoutPermission: () => void;
    Given('a Member aggregate without permission to manage members or system account', () => {
      passport = makePassport({ canManageMembers: false, isSystemAccount: false });
      member = new Member(makeBaseProps(), passport);
    });
    When('I try to set the memberName to "Bob"', () => {
      changeMemberNameWithoutPermission = () => {
        member.memberName = 'Bob';
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(changeMemberNameWithoutPermission).toThrow(DomainSeedwork.PermissionError);
      expect(changeMemberNameWithoutPermission).toThrow('Cannot set member name');
    });
  });

  Scenario('Changing the memberName to an invalid value', ({ Given, When, Then }) => {
    let changeMemberNameToInvalid: () => void;
    Given('a Member aggregate with permission to manage members', () => {
      passport = makePassport({ canManageMembers: true });
      member = new Member(makeBaseProps(), passport);
    });
    When('I try to set the memberName to an invalid value (e.g., null or empty string)', () => {
      changeMemberNameToInvalid = () => {
        // @ts-expect-error
        member.memberName = null;
      };
    });
    Then('an error should be thrown indicating the value is invalid', () => {
      expect(changeMemberNameToInvalid).throws('Wrong raw value type');
    });
  });

  Scenario('Changing the cybersourceCustomerId with permission to manage members', ({ Given, When, Then }) => {
    Given('a Member aggregate with permission to manage members', () => {
      passport = makePassport({ canManageMembers: true });
      member = new Member(makeBaseProps(), passport);
    });
    When('I set the cybersourceCustomerId to "cs_456"', () => {
      member.cybersourceCustomerId = 'cs_456';
    });
    Then("the member's cybersourceCustomerId should be \"cs_456\"", () => {
      expect(member.cybersourceCustomerId).toBe('cs_456');
    });
  });

  Scenario('Changing the cybersourceCustomerId with system account permission', ({ Given, When, Then }) => {
    Given('a Member aggregate with system account permission', () => {
      passport = makePassport({ canManageMembers: false, isSystemAccount: true });
      member = new Member(makeBaseProps(), passport);
    });
    When('I set the cybersourceCustomerId to "cs_456"', () => {
      member.cybersourceCustomerId = 'cs_456';
    });
    Then("the member's cybersourceCustomerId should be \"cs_456\"", () => {
      expect(member.cybersourceCustomerId).toBe('cs_456');
    });
  });

  Scenario('Changing the cybersourceCustomerId without permission', ({ Given, When, Then }) => {
    let changeCustomerId: () => void;
    Given('a Member aggregate without permission to manage members or system account', () => {
      passport = makePassport({ canManageMembers: false, isSystemAccount: false });
      member = new Member(makeBaseProps(), passport);
    });
    When('I try to set the cybersourceCustomerId to "cs_456"', () => {
      changeCustomerId = () => {
        member.cybersourceCustomerId = 'cs_456';
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(changeCustomerId).toThrow(DomainSeedwork.PermissionError);
      expect(changeCustomerId).toThrow('Cannot set cybersource customer id');
    });
  });

  Scenario('Changing the cybersourceCustomerId to an invalid value', ({ Given, When, Then }) => {
    let changeCustomerIdToInvalid: () => void;
    Given('a Member aggregate with permission to manage members', () => {
      passport = makePassport({ canManageMembers: true });
      member = new Member(makeBaseProps(), passport);
    });
    When('I try to set the cybersourceCustomerId to an invalid value (e.g., null or empty string)', () => {
      changeCustomerIdToInvalid = () => {
        member.cybersourceCustomerId = '';
      };
    });
    Then('an error should be thrown indicating the value is invalid', () => {
      expect(changeCustomerIdToInvalid).toThrow();
    });
  });

  Scenario('Changing the community with permission to manage members', ({ Given, When, Then }) => {
    let newCommunityRef: CommunityEntityReference;
    Given('a Member aggregate with permission to manage members', () => {
      passport = makePassport({ canManageMembers: true });
      member = new Member(makeBaseProps(), passport);
      newCommunityRef = makeCommunityEntityReference('community-2');
    });
    When('I set the community to a new CommunityEntityReference', () => {
      member.community = newCommunityRef;
    });
    Then("the member's community should reference the new CommunityEntityReference", () => {
      expect(member.community.id).toBe('community-2');
    });
  });

  Scenario('Changing the community with system account permission', ({ Given, When, Then }) => {
    let newCommunityRef: CommunityEntityReference;
    Given('a Member aggregate with system account permission', () => {
      passport = makePassport({ canManageMembers: false, isSystemAccount: true });
      member = new Member(makeBaseProps(), passport);
      newCommunityRef = makeCommunityEntityReference('community-2');
    });
    When('I set the community to a new CommunityEntityReference', () => {
      member.community = newCommunityRef;
    });
    Then("the member's community should reference the new CommunityEntityReference", () => {
      expect(member.community.id).toBe('community-2');
    });
  });

  Scenario('Changing the community without permission', ({ Given, When, Then }) => {
    let changeCommunityWithoutPermission: () => void;
    let newCommunityRef: CommunityEntityReference;
    Given('a Member aggregate without permission to manage members or system account', () => {
      passport = makePassport({ canManageMembers: false, isSystemAccount: false });
      member = new Member(makeBaseProps(), passport);
      newCommunityRef = makeCommunityEntityReference('community-2');
    });
    When('I try to set the community to a new CommunityEntityReference', () => {
      changeCommunityWithoutPermission = () => {
        member.community = newCommunityRef;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(changeCommunityWithoutPermission).toThrow(DomainSeedwork.PermissionError);
      expect(changeCommunityWithoutPermission).toThrow('Cannot set community');
    });
  });

  Scenario('Changing the role with permission to manage members', ({ Given, When, Then }) => {
    let newRoleRef: EndUserRoleEntityReference;
    Given('a Member aggregate with permission to manage members', () => {
      passport = makePassport({ canManageMembers: true });
      member = new Member(makeBaseProps(), passport);
      newRoleRef = makeRoleEntityReference('role-2');
    });
    When('I set the role to a new EndUserRoleEntityReference', () => {
      member.role = newRoleRef;
    });
    Then("the member's role should reference the new EndUserRoleEntityReference", () => {
      expect(member.role.id).toBe('role-2');
    });
  });

  Scenario('Changing the role with system account permission', ({ Given, When, Then }) => {
    let newRoleRef: EndUserRoleEntityReference;
    Given('a Member aggregate with system account permission', () => {
      passport = makePassport({ canManageMembers: false, isSystemAccount: true });
      member = new Member(makeBaseProps(), passport);
      newRoleRef = makeRoleEntityReference('role-2');
    });
    When('I set the role to a new EndUserRoleEntityReference', () => {
      member.role = newRoleRef;
    });
    Then("the member's role should reference the new EndUserRoleEntityReference", () => {
      expect(member.role.id).toBe('role-2');
    });
  });

  Scenario('Changing the role without permission', ({ Given, When, Then }) => {
    let changeRole: () => void;
    let newRoleRef: EndUserRoleEntityReference;
    Given('a Member aggregate without permission to manage members or system account', () => {
      passport = makePassport({ canManageMembers: false, isSystemAccount: false });
      member = new Member(makeBaseProps(), passport);
      newRoleRef = makeRoleEntityReference('role-2');
    });
    When('I try to set the role to a new EndUserRoleEntityReference', () => {
      changeRole = () => {
        member.role = newRoleRef;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(changeRole).toThrow(DomainSeedwork.PermissionError);
      expect(changeRole).toThrow('Cannot set role');
    });
  });

  Scenario('Requesting a new account with permission to manage members', ({ Given, When, Then }) => {
    let newAccount: MemberAccount;
    Given('a Member aggregate with permission to manage members', () => {
      passport = makePassport({ canManageMembers: true });
      member = new Member(makeBaseProps(), passport);
    });
    When('I call requestNewAccount', () => {
      newAccount = member.requestNewAccount();
    });
    Then('a new MemberAccount should be returned', () => {
      expect(newAccount).toBeDefined();
      expect(newAccount).toBeInstanceOf(MemberAccount);
    });
  });

  Scenario('Requesting a new account with system account permission', ({ Given, When, Then }) => {
    let newAccount: MemberAccount;
    Given('a Member aggregate with system account permission', () => {
      passport = makePassport({ canManageMembers: false, isSystemAccount: true });
      member = new Member(makeBaseProps(), passport);
    });
    When('I call requestNewAccount', () => {
      newAccount = member.requestNewAccount();
    });
    Then('a new MemberAccount should be returned', () => {
      expect(newAccount).toBeDefined();
      expect(newAccount).toBeInstanceOf(MemberAccount);
    });
  });

  Scenario('Requesting a new account without permission', ({ Given, When, Then }) => {
    let requestNewAccountWithoutPermission: () => void;
    Given('a Member aggregate without permission to manage members or system account', () => {
      passport = makePassport({ canManageMembers: false, isSystemAccount: false });
      member = new Member(makeBaseProps(), passport);
    });
    When('I try to call requestNewAccount', () => {
      requestNewAccountWithoutPermission = () => {
        member.requestNewAccount();
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(requestNewAccountWithoutPermission).toThrow(DomainSeedwork.PermissionError);
      expect(requestNewAccountWithoutPermission).toThrow('Cannot set role');
    });
  });

  Scenario('Requesting to remove an account with permission to manage members', ({ Given, When, Then }) => {
    let accountRef: MemberAccountProps;
    Given('a Member aggregate with permission to manage members and at least one account', () => {
      passport = makePassport({ canManageMembers: true });
      baseProps = makeBaseProps();
      member = new Member(baseProps, passport);
      accountRef = baseProps.accounts.items[0] as MemberAccountProps;
    });
    When('I call requestRemoveAccount with a valid MemberAccountEntityReference', () => {
      member.requestRemoveAccount(accountRef);
    });
    Then("the account should be removed from the member's accounts", () => {
      expect(baseProps.accounts.removeItem).toHaveBeenCalledWith(accountRef);
    });
  });

  Scenario('Requesting to remove an account with system account permission', ({ Given, When, Then }) => {
    let accountRef: MemberAccountProps;
    Given('a Member aggregate with system account permission and at least one account', () => {
      passport = makePassport({ canManageMembers: false, isSystemAccount: true });
      baseProps = makeBaseProps();
      member = new Member(baseProps, passport);
      accountRef = baseProps.accounts.items[0] as MemberAccountProps;
    });
    When('I call requestRemoveAccount with a valid MemberAccountEntityReference', () => {
      member.requestRemoveAccount(accountRef);
    });
    Then("the account should be removed from the member's accounts", () => {
      expect(baseProps.accounts.removeItem).toHaveBeenCalledWith(accountRef);
    });
  });

  Scenario('Requesting to remove an account without permission', ({ Given, When, Then }) => {
    let requestRemoveAccount: () => void;
    let accountRef: MemberAccountProps;
    Given('a Member aggregate without permission to manage members or system account and at least one account', () => {
      passport = makePassport({ canManageMembers: false, isSystemAccount: false });
      baseProps = makeBaseProps();
      member = new Member(baseProps, passport);
      accountRef = baseProps.accounts.items[0] as MemberAccountProps;
    });
    When('I try to call requestRemoveAccount with a valid MemberAccountEntityReference', () => {
      requestRemoveAccount = () => {
        member.requestRemoveAccount(accountRef);
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(requestRemoveAccount).toThrow(DomainSeedwork.PermissionError);
      expect(requestRemoveAccount).toThrow('Cannot set role');
    });
  });

  Scenario('Requesting a new custom view with permission to manage members', ({ Given, When, Then }) => {
    let newCustomView: MemberCustomViewProps;
    Given('a Member aggregate with permission to manage members', () => {
      passport = makePassport({ canManageMembers: true });
      member = new Member(makeBaseProps(), passport);
    });
    When('I call requestNewCustomView', () => {
      newCustomView = member.requestNewCustomView();
    });
    Then('a new MemberCustomView should be returned', () => {
      expect(newCustomView).toBeDefined();
      expect(newCustomView).toBeInstanceOf(MemberCustomView);
    });
  });

  Scenario('Requesting a new custom view with system account permission', ({ Given, When, Then }) => {
    let newCustomView: MemberCustomViewProps;
    Given('a Member aggregate with system account permission', () => {
      passport = makePassport({ canManageMembers: false, isSystemAccount: true });
      member = new Member(makeBaseProps(), passport);
    });
    When('I call requestNewCustomView', () => {
      newCustomView = member.requestNewCustomView();
    });
    Then('a new MemberCustomView should be returned', () => {
      expect(newCustomView).toBeDefined();
      expect(newCustomView).toBeInstanceOf(MemberCustomView);
    });
  });

  Scenario('Requesting a new custom view without permission', ({ Given, When, Then }) => {
    let requestNewCustomView: () => void;
    Given('a Member aggregate without permission to manage members or system account', () => {
      passport = makePassport({ canManageMembers: false, isSystemAccount: false });
      member = new Member(makeBaseProps(), passport);
    });
    When('I try to call requestNewCustomView', () => {
      requestNewCustomView = () => {
        member.requestNewCustomView();
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(requestNewCustomView).toThrow(DomainSeedwork.PermissionError);
      expect(requestNewCustomView).toThrow('Cannot set custom view');
    });
  });

  Scenario('Requesting to remove a custom view with permission to manage members', ({ Given, When, Then }) => {
    let customView: MemberCustomView;
    Given('a Member aggregate with permission to manage members and at least one custom view', () => {
      passport = makePassport({ canManageMembers: true });
      baseProps = makeBaseProps();
      member = new Member(baseProps, passport);
      customView = { name: 'View1', props: baseProps.customViews.items[0] as MemberCustomViewProps } as MemberCustomView;
    });
    When('I call requestRemoveCustomView with a valid MemberCustomView', () => {
      member.requestRemoveCustomView(customView);
    });
    Then("the custom view should be removed from the member's customViews", () => {
      expect(baseProps.customViews.removeItem).toHaveBeenCalledWith(customView.props);
    });
  });

  Scenario('Requesting to remove a custom view with system account permission', ({ Given, When, Then }) => {
    let customView: MemberCustomView;
    Given('a Member aggregate with system account permission and at least one custom view', () => {
      passport = makePassport({ canManageMembers: false, isSystemAccount: true });
      baseProps = makeBaseProps();
      member = new Member(baseProps, passport);
      customView = { name: 'View1', props: baseProps.customViews.items[0] as MemberCustomViewProps } as MemberCustomView;
    });
    When('I call requestRemoveCustomView with a valid MemberCustomView', () => {
      member.requestRemoveCustomView(customView);
    });
    Then("the custom view should be removed from the member's customViews", () => {
      expect(baseProps.customViews.removeItem).toHaveBeenCalledWith(customView.props);
    });
  });

  Scenario('Requesting to remove a custom view without permission', ({ Given, When, Then }) => {
    let requestRemoveCustomView: () => void;
    let customView: MemberCustomView;
    Given('a Member aggregate without permission to manage members or system account and at least one custom view', () => {
      passport = makePassport({ canManageMembers: false, isSystemAccount: false });
      baseProps = makeBaseProps();
      member = new Member(baseProps, passport);
      customView = { name: 'View1', props: baseProps.customViews.items[0] as MemberCustomViewProps } as MemberCustomView;
    });
    When('I try to call requestRemoveCustomView with a valid MemberCustomView', () => {
      requestRemoveCustomView = () => {
        member.requestRemoveCustomView(customView);
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(requestRemoveCustomView).toThrow(DomainSeedwork.PermissionError);
      expect(requestRemoveCustomView).toThrow('Cannot remove custom view');
    });
  });

  Scenario('Getting profile, accounts, customViews, createdAt, updatedAt, and schemaVersion', ({ Given, Then, And }) => {
    Given('a Member aggregate', () => {
      passport = makePassport();
      baseProps = makeBaseProps();
      member = new Member(baseProps, passport);
    });
    Then('the profile property should return a MemberProfile entity', () => {
      expect(member.profile).toBeDefined();
    });
    And('the accounts property should return an array of MemberAccount entities', () => {
      expect(Array.isArray(member.accounts)).toBe(true);
    });
    And('the customViews property should return an array of MemberCustomView entities', () => {
      expect(Array.isArray(member.customViews)).toBe(true);
    });
    And('the createdAt property should return the correct date', () => {
      expect(member.createdAt).toEqual(new Date('2020-01-01T00:00:00Z'));
    });
    And('the updatedAt property should return the correct date', () => {
      expect(member.updatedAt).toEqual(new Date('2020-01-02T00:00:00Z'));
    });
    And('the schemaVersion property should return the correct version', () => {
      expect(member.schemaVersion).toBe('1.0.0');
    });
  });
});
