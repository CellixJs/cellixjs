import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { StaffRolePermissions } from './staff-role-permissions.ts';
import { StaffRoleCommunityPermissions } from './staff-role-community-permissions.ts';
import { StaffRolePropertyPermissions } from './staff-role-property-permissions.ts';
import { StaffRoleServiceTicketPermissions } from './staff-role-service-ticket-permissions.ts';
import { StaffRoleServicePermissions } from './staff-role-service-permissions.ts';
import { StaffRoleViolationTicketPermissions } from './staff-role-violation-ticket-permissions.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/staff-role-permissions.feature'),
);

function makeVisa() {
  return vi.mocked({
    determineIf: vi.fn(() => true),
  });
}

function makeProps() {
  return {
    communityPermissions: {} as StaffRoleCommunityPermissions,
    propertyPermissions: {} as StaffRolePropertyPermissions,
    serviceTicketPermissions: {} as StaffRoleServiceTicketPermissions,
    servicePermissions: {} as StaffRoleServicePermissions,
    violationTicketPermissions: {} as StaffRoleViolationTicketPermissions,
  };
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let visa: ReturnType<typeof makeVisa>;
  let props: ReturnType<typeof makeProps>;
  let entity: StaffRolePermissions;

  BeforeEachScenario(() => {
    visa = makeVisa();
    props = makeProps();
    entity = new StaffRolePermissions(props, visa);
  });

  Background(({ Given, And }) => {
    Given('valid StaffRolePermissionsProps with all required permission props', () => {
      props = makeProps();
    });
    And('a valid UserVisa', () => {
      visa = makeVisa();
    });
  });

  Scenario('Accessing communityPermissions', ({ Given, When, Then }) => {
    let communityPermissions: StaffRoleCommunityPermissions;
    Given('a StaffRolePermissions entity', () => {
      entity = new StaffRolePermissions(props, visa);
    });
    When('I access the communityPermissions property', () => {
      communityPermissions = entity.communityPermissions;
    });
    Then('I should receive a StaffRoleCommunityPermissions entity instance', () => {
      expect(communityPermissions).toBeInstanceOf(StaffRoleCommunityPermissions);
    });
  });

  Scenario('Accessing propertyPermissions', ({ Given, When, Then }) => {
    let propertyPermissions: StaffRolePropertyPermissions;
    Given('a StaffRolePermissions entity', () => {
      entity = new StaffRolePermissions(props, visa);
    });
    When('I access the propertyPermissions property', () => {
      propertyPermissions = entity.propertyPermissions;
    });
    Then('I should receive a StaffRolePropertyPermissions entity instance', () => {
      expect(propertyPermissions).toBeInstanceOf(StaffRolePropertyPermissions);
    });
  });

  Scenario('Accessing serviceTicketPermissions', ({ Given, When, Then }) => {
    let serviceTicketPermissions: StaffRoleServiceTicketPermissions;
    Given('a StaffRolePermissions entity', () => {
      entity = new StaffRolePermissions(props, visa);
    });
    When('I access the serviceTicketPermissions property', () => {
      serviceTicketPermissions = entity.serviceTicketPermissions;
    });
    Then('I should receive a StaffRoleServiceTicketPermissions entity instance', () => {
      expect(serviceTicketPermissions).toBeInstanceOf(StaffRoleServiceTicketPermissions);
    });
  });

  Scenario('Accessing servicePermissions', ({ Given, When, Then }) => {
    let servicePermissions: StaffRoleServicePermissions;
    Given('a StaffRolePermissions entity', () => {
      entity = new StaffRolePermissions(props, visa);
    });
    When('I access the servicePermissions property', () => {
      servicePermissions = entity.servicePermissions;
    });
    Then('I should receive a StaffRoleServicePermissions entity instance', () => {
      expect(servicePermissions).toBeInstanceOf(StaffRoleServicePermissions);
    });
  });

  Scenario('Accessing violationTicketPermissions', ({ Given, When, Then }) => {
    let violationTicketPermissions: StaffRoleViolationTicketPermissions;
    Given('a StaffRolePermissions entity', () => {
      entity = new StaffRolePermissions(props, visa);
    });
    When('I access the violationTicketPermissions property', () => {
      violationTicketPermissions = entity.violationTicketPermissions;
    });
    Then('I should receive a StaffRoleViolationTicketPermissions entity instance', () => {
      expect(violationTicketPermissions).toBeInstanceOf(StaffRoleViolationTicketPermissions);
    });
  });
});
