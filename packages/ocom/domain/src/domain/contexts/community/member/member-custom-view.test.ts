import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { MemberCustomView, type MemberCustomViewProps } from './member-custom-view.ts';
import { DomainSeedwork } from '@cellix/domain-seedwork';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/member-custom-view.feature'),
);

function makeVisa(overrides: Partial<{
  canManageMembers: boolean;
  canEditOwnMemberAccounts: boolean;
  isEditingOwnMemberAccount: boolean;
  isSystemAccount: boolean;
}> = {}) {
  return vi.mocked({
    determineIf: (fn: (p: {
      canManageMembers: boolean;
      canEditOwnMemberAccounts: boolean;
      isEditingOwnMemberAccount: boolean;
      isSystemAccount: boolean;
    }) => boolean) =>
      fn({
        canManageMembers: overrides.canManageMembers ?? false,
        canEditOwnMemberAccounts: overrides.canEditOwnMemberAccounts ?? false,
        isEditingOwnMemberAccount: overrides.isEditingOwnMemberAccount ?? false,
        isSystemAccount: overrides.isSystemAccount ?? false,
      }),
  });
}

function makeProps(overrides: Partial<MemberCustomViewProps> = {}): MemberCustomViewProps {
  return {
    id: 'view-123',
    name: 'Default View',
    type: 'list',
    filters: ['active'],
    sortOrder: 'asc',
    columnsToDisplay: ['name', 'email'],
    ...overrides,
  };
}

describeFeature(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let visa: ReturnType<typeof makeVisa>;
  let props: MemberCustomViewProps;
  let entity: MemberCustomView;

  BeforeEachScenario(() => {
    visa = makeVisa({ canManageMembers: true });
    props = makeProps();
    entity = new MemberCustomView(props, visa);
  });

  Background(({ Given, And }) => {
    Given('valid MemberCustomViewProps with name "Default View", type "list", filters ["active"], sortOrder "asc", columnsToDisplay ["name", "email"]', () => {
      props = makeProps();
    });
    And('a valid CommunityVisa', () => {
      visa = makeVisa({ canManageMembers: true });
    });
  });

  Scenario('Getting name, type, filters, sortOrder, and columnsToDisplay', ({ Given, Then, And }) => {
    Given('a MemberCustomView entity', () => {
      entity = new MemberCustomView(props, visa);
    });
    Then('the name property should return "Default View"', () => {
      expect(entity.name).toBe('Default View');
    });
    And('the type property should return "list"', () => {
      expect(entity.type).toBe('list');
    });
    And('the filters property should return ["active"]', () => {
      expect(entity.filters).toEqual(['active']);
    });
    And('the sortOrder property should return "asc"', () => {
      expect(entity.sortOrder).toBe('asc');
    });
    And('the columnsToDisplay property should return ["name", "email"]', () => {
      expect(entity.columnsToDisplay).toEqual(['name', 'email']);
    });
  });

  Scenario('Changing name with permission to manage members', ({ Given, When, Then }) => {
    Given('a MemberCustomView entity with permission to manage members', () => {
      visa = makeVisa({ canManageMembers: true });
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I set the name to "My View"', () => {
      entity.name = 'My View';
    });
    Then('the name property should return "My View"', () => {
      expect(entity.name).toBe('My View');
    });
  });

  Scenario('Changing name with permission to edit own member account and is editing own member account', ({ Given, When, Then }) => {
    Given('a MemberCustomView entity with permission to edit own member accounts and is editing own member account', () => {
      visa = makeVisa({ canEditOwnMemberAccounts: true, isEditingOwnMemberAccount: true });
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I set the name to "My View"', () => {
      entity.name = 'My View';
    });
    Then('the name property should return "My View"', () => {
      expect(entity.name).toBe('My View');
    });
  });

  Scenario('Changing name with system account permission', ({ Given, When, Then }) => {
    Given('a MemberCustomView entity with system account permission', () => {
      visa = makeVisa({ isSystemAccount: true });
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I set the name to "My View"', () => {
      entity.name = 'My View';
    });
    Then('the name property should return "My View"', () => {
      expect(entity.name).toBe('My View');
    });
  });

  Scenario('Changing name without permission', ({ Given, When, Then }) => {
    let setName: () => void;
    Given('a MemberCustomView entity without permission to manage members, system account, or edit own member accounts', () => {
      visa = makeVisa();
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I try to set the name to "My View"', () => {
      setName = () => {
        entity.name = 'My View';
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setName).toThrow(DomainSeedwork.PermissionError);
    });
  });

  Scenario('Changing name to an invalid value', ({ Given, When, Then }) => {
    let setNameInvalid: () => void;
    Given('a MemberCustomView entity with permission to manage members', () => {
      visa = makeVisa({ canManageMembers: true });
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I try to set the name to an invalid value (e.g., null or empty string)', () => {
      setNameInvalid = () => {
        // @ts-expect-error
        entity.name = null;
      };
    });
    Then('an error should be thrown indicating the value is invalid', () => {
      expect(setNameInvalid).toThrow();
    });
  });

  Scenario('Changing type with permission to manage members', ({ Given, When, Then }) => {
    Given('a MemberCustomView entity with permission to manage members', () => {
      visa = makeVisa({ canManageMembers: true });
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I set the type to "PROPERTY"', () => {
      entity.type = 'PROPERTY';
    });
    Then('the type property should return "PROPERTY"', () => {
      expect(entity.type).toBe('PROPERTY');
    });
  });

  Scenario('Changing type with permission to edit own member account and is editing own member account', ({ Given, When, Then }) => {
    Given('a MemberCustomView entity with permission to edit own member accounts and is editing own member account', () => {
      visa = makeVisa({ canEditOwnMemberAccounts: true, isEditingOwnMemberAccount: true });
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I set the type to "PROPERTY"', () => {
      entity.type = 'PROPERTY';
    });
    Then('the type property should return "PROPERTY"', () => {
      expect(entity.type).toBe('PROPERTY');
    });
  });

  Scenario('Changing type with system account permission', ({ Given, When, Then }) => {
    Given('a MemberCustomView entity with system account permission', () => {
      visa = makeVisa({ isSystemAccount: true });
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I set the type to "PROPERTY"', () => {
      entity.type = 'PROPERTY';
    });
    Then('the type property should return "PROPERTY"', () => {
      expect(entity.type).toBe('PROPERTY');
    });
  });

  Scenario('Changing type without permission', ({ Given, When, Then }) => {
    let setType: () => void;
    Given('a MemberCustomView entity without permission to manage members, system account, or edit own member accounts', () => {
      visa = makeVisa();
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I try to set the type to "PROPERTY"', () => {
      setType = () => {
        entity.type = 'PROPERTY';
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setType).toThrow(DomainSeedwork.PermissionError);
    });
  });

  Scenario('Changing type to an invalid value', ({ Given, When, Then }) => {
    let setTypeInvalid: () => void;
    Given('a MemberCustomView entity with permission to manage members', () => {
      visa = makeVisa({ canManageMembers: true });
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I try to set the type to an invalid value "INVALID"', () => {
      setTypeInvalid = () => {
        entity.type = 'INVALID';
      };
    });
    Then('an error should be thrown indicating the value is invalid', () => {
      expect(setTypeInvalid).toThrow();
    });
  });

  Scenario('Changing filters with permission to manage members', ({ Given, When, Then }) => {
    Given('a MemberCustomView entity with permission to manage members', () => {
      visa = makeVisa({ canManageMembers: true });
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I set the filters to ["inactive"]', () => {
      entity.filters = ['inactive'];
    });
    Then('the filters property should return ["inactive"]', () => {
      expect(entity.filters).toEqual(['inactive']);
    });
  });

  Scenario('Changing filters with permission to edit own member account and is editing own member account', ({ Given, When, Then }) => {
    Given('a MemberCustomView entity with permission to edit own member accounts and is editing own member account', () => {
      visa = makeVisa({ canEditOwnMemberAccounts: true, isEditingOwnMemberAccount: true });
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I set the filters to ["inactive"]', () => {
      entity.filters = ['inactive'];
    });
    Then('the filters property should return ["inactive"]', () => {
      expect(entity.filters).toEqual(['inactive']);
    });
  });

  Scenario('Changing filters with system account permission', ({ Given, When, Then }) => {
    Given('a MemberCustomView entity with system account permission', () => {
      visa = makeVisa({ isSystemAccount: true });
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I set the filters to ["inactive"]', () => {
      entity.filters = ['inactive'];
    });
    Then('the filters property should return ["inactive"]', () => {
      expect(entity.filters).toEqual(['inactive']);
    });
  });

  Scenario('Changing filters without permission', ({ Given, When, Then }) => {
    let setFilters: () => void;
    Given('a MemberCustomView entity without permission to manage members, system account, or edit own member accounts', () => {
      visa = makeVisa();
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I try to set the filters to ["inactive"]', () => {
      setFilters = () => {
        entity.filters = ['inactive'];
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setFilters).toThrow(DomainSeedwork.PermissionError);
    });
  });

  Scenario('Changing filters to an invalid value', ({ Given, When, Then }) => {
    let setFiltersInvalid: () => void;
    Given('a MemberCustomView entity with permission to manage members', () => {
      visa = makeVisa({ canManageMembers: true });
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I try to set the filters to an invalid value (e.g., a string instead of an array)', () => {
      setFiltersInvalid = () => {
        // @ts-expect-error
        entity.filters = 'not-an-array';
      };
    });
    Then('an error should be thrown indicating the value is invalid', () => {
      expect(setFiltersInvalid).toThrow();
    });
  });

  Scenario('Changing sortOrder with permission to manage members', ({ Given, When, Then }) => {
    Given('a MemberCustomView entity with permission to manage members', () => {
      visa = makeVisa({ canManageMembers: true });
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I set the sortOrder to "desc"', () => {
      entity.sortOrder = 'desc';
    });
    Then('the sortOrder property should return "desc"', () => {
      expect(entity.sortOrder).toBe('desc');
    });
  });

  Scenario('Changing sortOrder with permission to edit own member account and is editing own member account', ({ Given, When, Then }) => {
    Given('a MemberCustomView entity with permission to edit own member accounts and is editing own member account', () => {
      visa = makeVisa({ canEditOwnMemberAccounts: true, isEditingOwnMemberAccount: true });
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I set the sortOrder to "desc"', () => {
      entity.sortOrder = 'desc';
    });
    Then('the sortOrder property should return "desc"', () => {
      expect(entity.sortOrder).toBe('desc');
    });
  });

  Scenario('Changing sortOrder with system account permission', ({ Given, When, Then }) => {
    Given('a MemberCustomView entity with system account permission', () => {
      visa = makeVisa({ isSystemAccount: true });
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I set the sortOrder to "desc"', () => {
      entity.sortOrder = 'desc';
    });
    Then('the sortOrder property should return "desc"', () => {
      expect(entity.sortOrder).toBe('desc');
    });
  });

  Scenario('Changing sortOrder without permission', ({ Given, When, Then }) => {
    let setSortOrder: () => void;
    Given('a MemberCustomView entity without permission to manage members, system account, or edit own member accounts', () => {
      visa = makeVisa();
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I try to set the sortOrder to "desc"', () => {
      setSortOrder = () => {
        entity.sortOrder = 'desc';
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setSortOrder).toThrow(DomainSeedwork.PermissionError);
    });
  });

  Scenario('Changing sortOrder to an invalid value', ({ Given, When, Then }) => {
    let setSortOrderInvalid: () => void;
    Given('a MemberCustomView entity with permission to manage members', () => {
      visa = makeVisa({ canManageMembers: true });
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I try to set the sortOrder to an invalid value (e.g., null or empty string)', () => {
      setSortOrderInvalid = () => {
        // @ts-expect-error
        entity.sortOrder = null;
      };
    });
    Then('an error should be thrown indicating the value is invalid', () => {
      expect(setSortOrderInvalid).toThrow();
    });
  });

  Scenario('Changing columnsToDisplay with permission to manage members', ({ Given, When, Then }) => {
    Given('a MemberCustomView entity with permission to manage members', () => {
      visa = makeVisa({ canManageMembers: true });
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I set the columnsToDisplay to ["email", "status"]', () => {
      entity.columnsToDisplay = ['email', 'status'];
    });
    Then('the columnsToDisplay property should return ["email", "status"]', () => {
      expect(entity.columnsToDisplay).toEqual(['email', 'status']);
    });
  });

  Scenario('Changing columnsToDisplay with permission to edit own member account and is editing own member account', ({ Given, When, Then }) => {
    Given('a MemberCustomView entity with permission to edit own member accounts and is editing own member account', () => {
      visa = makeVisa({ canEditOwnMemberAccounts: true, isEditingOwnMemberAccount: true });
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I set the columnsToDisplay to ["email", "status"]', () => {
      entity.columnsToDisplay = ['email', 'status'];
    });
    Then('the columnsToDisplay property should return ["email", "status"]', () => {
      expect(entity.columnsToDisplay).toEqual(['email', 'status']);
    });
  });

  Scenario('Changing columnsToDisplay with system account permission', ({ Given, When, Then }) => {
    Given('a MemberCustomView entity with system account permission', () => {
      visa = makeVisa({ isSystemAccount: true });
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I set the columnsToDisplay to ["email", "status"]', () => {
      entity.columnsToDisplay = ['email', 'status'];
    });
    Then('the columnsToDisplay property should return ["email", "status"]', () => {
      expect(entity.columnsToDisplay).toEqual(['email', 'status']);
    });
  });

  Scenario('Changing columnsToDisplay without permission', ({ Given, When, Then }) => {
    let setColumns: () => void;
    Given('a MemberCustomView entity without permission to manage members, system account, or edit own member accounts', () => {
      visa = makeVisa();
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I try to set the columnsToDisplay to ["email", "status"]', () => {
      setColumns = () => {
        entity.columnsToDisplay = ['email', 'status'];
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(setColumns).toThrow(DomainSeedwork.PermissionError);
    });
  });

  Scenario('Changing columnsToDisplay to an invalid value', ({ Given, When, Then }) => {
    let setColumnsInvalid: () => void;
    Given('a MemberCustomView entity with permission to manage members', () => {
      visa = makeVisa({ canManageMembers: true });
      entity = new MemberCustomView(makeProps(), visa);
    });
    When('I try to set the columnsToDisplay to an invalid value (e.g., a string instead of array)', () => {
      setColumnsInvalid = () => {
        // @ts-expect-error
        entity.columnsToDisplay = 'not-an-array';
      };
    });
    Then('an error should be thrown indicating the value is invalid', () => {
      expect(setColumnsInvalid).toThrow();
    });
  });
});