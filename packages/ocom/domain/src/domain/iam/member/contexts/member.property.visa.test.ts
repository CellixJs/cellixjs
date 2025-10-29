import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { PropertyEntityReference } from '../../../contexts/property/property/property.aggregate.ts';
import type { MemberEntityReference } from '../../../contexts/community/member/member.ts';
import { MemberPropertyVisa } from './member.property.visa.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/member.property.visa.feature'),
);

function makeProperty(id = 'property-1', communityId = 'community-1', ownerId = 'member-1') {
  return {
    id,
    community: { id: communityId },
    owner: { id: ownerId },
  } as PropertyEntityReference;
}

function makeMember(
  id = 'member-1',
  communityId = 'community-1',
  roleOverrides: Partial<{ propertyPermissions: Record<string, unknown> }> = {}
) {
  return {
    id,
    community: { id: communityId },
    role: {
      permissions: {
        propertyPermissions: {
          canManageProperties: true,
          canEditOwnProperty: true,
          ...roleOverrides.propertyPermissions,
        },
      },
    },
  } as unknown as MemberEntityReference;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let property: PropertyEntityReference;
  let member: MemberEntityReference;
  let visa: MemberPropertyVisa<PropertyEntityReference>;

  BeforeEachScenario(() => {
    property = makeProperty();
    member = makeMember();
    visa = undefined as unknown as MemberPropertyVisa<PropertyEntityReference>;
  });

  Background(({ Given, And }) => {
    Given('a valid PropertyEntityReference with id "property-1", community id "community-1", owner id "member-1"', () => {
      property = makeProperty('property-1', 'community-1', 'member-1');
    });
    And('a valid MemberEntityReference with id "member-1", community id "community-1", and role with property permissions', () => {
      member = makeMember('member-1', 'community-1');
    });
  });

  Scenario('Creating a MemberPropertyVisa with a member belonging to the community', ({ When, Then }) => {
    When('I create a MemberPropertyVisa with the property and member', () => {
      visa = new MemberPropertyVisa(property, member);
    });
    Then('the visa should be created successfully', () => {
      expect(visa).toBeInstanceOf(MemberPropertyVisa);
    });
  });

  Scenario('determineIf returns true when the permission function returns true', ({ Given, When, Then }) => {
    let result: boolean;
    Given('a MemberPropertyVisa for the property and member', () => {
      visa = new MemberPropertyVisa(property, member);
    });
    When('I call determineIf with a function that returns true if canManageProperties is true', () => {
      result = visa.determineIf((p) => p.canManageProperties === true);
    });
    Then('the result should be true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('determineIf returns false when the permission function returns false', ({ Given, When, Then }) => {
    let result: boolean;
    Given('a MemberPropertyVisa for the property and member', () => {
      visa = new MemberPropertyVisa(property, member);
    });
    When('I call determineIf with a function that returns false', () => {
      result = visa.determineIf(() => false);
    });
    Then('the result should be false', () => {
      expect(result).toBe(false);
    });
  });

  Scenario('determineIf returns false if the member does not belong to the community', ({ Given, And, When, Then }) => {
    let result: boolean;
    Given('a MemberEntityReference with community id "community-2"', () => {
      member = makeMember('member-1', 'community-2');
    });
    And('a PropertyEntityReference with community id "community-1"', () => {
      property = makeProperty('property-1', 'community-1', 'member-1');
    });
    When('I create a MemberPropertyVisa with the property and member', () => {
      visa = new MemberPropertyVisa(property, member);
    });
    And('I call determineIf with any function', () => {
      result = visa.determineIf(() => true);
    });
    Then('the result should be false', () => {
      expect(result).toBe(false);
    });
  });

  Scenario('determineIf returns true if the member\'s role has the required permission', ({ Given, And, When, Then }) => {
    let result: boolean;
    Given('a MemberEntityReference with propertyPermissions where canManageProperties is true', () => {
      member = makeMember('member-1', 'community-1', {
        propertyPermissions: { canManageProperties: true }
      });
    });
    And('a PropertyEntityReference with community id "community-1"', () => {
      property = makeProperty('property-1', 'community-1', 'member-1');
    });
    When('I create a MemberPropertyVisa with the property and member', () => {
      visa = new MemberPropertyVisa(property, member);
    });
    And('I call determineIf with a function that returns canManageProperties', () => {
      result = visa.determineIf((p) => p.canManageProperties === true);
    });
    Then('the result should be true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('determineIf returns false if the member\'s role does not have the required permission', ({ Given, And, When, Then }) => {
    let result: boolean;
    Given('a MemberEntityReference with propertyPermissions where canManageProperties is false', () => {
      member = makeMember('member-1', 'community-1', {
        propertyPermissions: { canManageProperties: false }
      });
    });
    And('a PropertyEntityReference with community id "community-1"', () => {
      property = makeProperty('property-1', 'community-1', 'member-1');
    });
    When('I create a MemberPropertyVisa with the property and member', () => {
      visa = new MemberPropertyVisa(property, member);
    });
    And('I call determineIf with a function that returns canManageProperties', () => {
      result = visa.determineIf((p) => p.canManageProperties === true);
    });
    Then('the result should be false', () => {
      expect(result).toBe(false);
    });
  });

  Scenario('determineIf sets isEditingOwnProperty to true when member is the owner', ({ Given, When, Then }) => {
    let result: boolean;
    Given('a MemberPropertyVisa for the property and member', () => {
      visa = new MemberPropertyVisa(property, member);
    });
    When('I call determineIf with a function that returns isEditingOwnProperty', () => {
      result = visa.determineIf((p) => p.isEditingOwnProperty);
    });
    Then('the result should be true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('determineIf sets isEditingOwnProperty to false when member is not the owner', ({ Given, When, Then, And }) => {
    let result: boolean;
    Given('a MemberEntityReference with id "member-2"', () => {
      member = makeMember('member-2', 'community-1');
    });
    When('I create a MemberPropertyVisa with the property and member', () => {
      visa = new MemberPropertyVisa(property, member);
    });
    And('I call determineIf with a function that returns isEditingOwnProperty', () => {
      result = visa.determineIf((p) => p.isEditingOwnProperty);
    });
    Then('the result should be false', () => {
      expect(result).toBe(false);
    });
  });

  Scenario('determineIf sets canEditOwnProperty based on role permissions', ({ Given, When, Then, And }) => {
    let result: boolean;
    Given('a MemberEntityReference with propertyPermissions where canEditOwnProperty is true', () => {
      member = makeMember('member-1', 'community-1', {
        propertyPermissions: { canEditOwnProperty: true }
      });
    });
    When('I create a MemberPropertyVisa with the property and member', () => {
      visa = new MemberPropertyVisa(property, member);
    });
    And('I call determineIf with a function that returns canEditOwnProperty', () => {
      result = visa.determineIf((p) => p.canEditOwnProperty);
    });
    Then('the result should be true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('determineIf sets isSystemAccount to false', ({ Given, When, Then }) => {
    let result: boolean;
    Given('a MemberPropertyVisa for the property and member', () => {
      visa = new MemberPropertyVisa(property, member);
    });
    When('I call determineIf with a function that returns isSystemAccount', () => {
      result = visa.determineIf((p) => p.isSystemAccount === false);
    });
    Then('the result should be true', () => {
      expect(result).toBe(true);
    });
  });
});