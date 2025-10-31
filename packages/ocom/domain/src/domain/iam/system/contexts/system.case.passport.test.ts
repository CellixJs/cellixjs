import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { SystemCasePassport } from './system.case.passport.ts';
import type { CaseDomainPermissions } from '../../../contexts/case/case.domain-permissions.ts';
import type { ServiceTicketV1EntityReference } from '../../../contexts/case/service-ticket/v1/service-ticket-v1.aggregate.ts';
import type { ViolationTicketV1EntityReference } from '../../../contexts/case/violation-ticket/v1/violation-ticket-v1.aggregate.ts';
import type { ServiceTicketV1Visa } from '../../../contexts/case/service-ticket/v1/service-ticket-v1.visa.ts';
import type { ViolationTicketV1Visa } from '../../../contexts/case/violation-ticket/v1/violation-ticket-v1.visa.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/system.case.passport.feature'),
);

function makeServiceTicketV1(id = 'service-ticket-1') {
  return { id } as ServiceTicketV1EntityReference;
}

function makeViolationTicketV1(id = 'violation-ticket-1') {
  return { id } as ViolationTicketV1EntityReference;
}

test.for(feature, ({ Scenario, Background }) => {
  let passport: SystemCasePassport;
  let permissions: Partial<CaseDomainPermissions>;
  let serviceTicketRef: ServiceTicketV1EntityReference;
  let violationTicketRef: ViolationTicketV1EntityReference;
  let serviceTicketVisa: ServiceTicketV1Visa;
  let violationTicketVisa: ViolationTicketV1Visa;
  let permissionResult: boolean;

  Background(({ Given }) => {
    Given('I have case domain permissions with canCreateTickets true', () => {
      permissions = {
        canCreateTickets: true
      };
    });
  });

  Scenario('Creating SystemCasePassport and getting visa for service ticket V1', ({ Given, When, Then, And }) => {
    Given('I create a SystemCasePassport with permissions', () => {
      passport = new SystemCasePassport(permissions);
    });

    And('I have a service ticket V1 entity reference', () => {
      serviceTicketRef = makeServiceTicketV1();
    });

    When('I call forServiceTicketV1 with the service ticket reference', () => {
      serviceTicketVisa = passport.forServiceTicketV1(serviceTicketRef);
    });

    Then('it should return a ServiceTicketV1Visa', () => {
      expect(serviceTicketVisa).toBeDefined();
      expect(typeof serviceTicketVisa.determineIf).toBe('function');
    });

    And('the visa should allow determining permissions', () => {
      expect(typeof serviceTicketVisa.determineIf).toBe('function');
      const result = serviceTicketVisa.determineIf((perms: Readonly<CaseDomainPermissions>) => perms.canCreateTickets);
      expect(typeof result).toBe('boolean');
    });
  });

  Scenario('Creating SystemCasePassport and getting visa for violation ticket V1', ({ Given, When, Then, And }) => {
    Given('I create a SystemCasePassport with permissions', () => {
      passport = new SystemCasePassport(permissions);
    });

    And('I have a violation ticket V1 entity reference', () => {
      violationTicketRef = makeViolationTicketV1();
    });

    When('I call forViolationTicketV1 with the violation ticket reference', () => {
      violationTicketVisa = passport.forViolationTicketV1(violationTicketRef);
    });

    Then('it should return a ViolationTicketV1Visa', () => {
      expect(violationTicketVisa).toBeDefined();
      expect(typeof violationTicketVisa.determineIf).toBe('function');
    });

    And('the visa should allow determining permissions', () => {
      expect(typeof violationTicketVisa.determineIf).toBe('function');
      const result = violationTicketVisa.determineIf((perms: Readonly<CaseDomainPermissions>) => perms.canCreateTickets);
      expect(typeof result).toBe('boolean');
    });
  });

  Scenario('Creating SystemCasePassport with no permissions', ({ Given, When, Then, And }) => {
    Given('I create a SystemCasePassport with no permissions', () => {
      passport = new SystemCasePassport();
    });

    And('I have a service ticket V1 entity reference', () => {
      serviceTicketRef = makeServiceTicketV1();
    });

    When('I call forServiceTicketV1 with the service ticket reference', () => {
      serviceTicketVisa = passport.forServiceTicketV1(serviceTicketRef);
    });

    Then('it should return a ServiceTicketV1Visa that works with empty permissions', () => {
      expect(serviceTicketVisa).toBeDefined();
      expect(typeof serviceTicketVisa.determineIf).toBe('function');
    });
  });

  Scenario('Using visa to determine permissions for service ticket', ({ Given, When, Then, And }) => {
    Given('I create a SystemCasePassport with canCreateTickets permission', () => {
      passport = new SystemCasePassport({ canCreateTickets: true });
    });

    And('I have a service ticket V1 entity reference', () => {
      serviceTicketRef = makeServiceTicketV1();
    });

    When('I get a visa for the service ticket', () => {
      serviceTicketVisa = passport.forServiceTicketV1(serviceTicketRef);
    });

    And('I use determineIf to check if canCreateTickets is true', () => {
      permissionResult = serviceTicketVisa.determineIf((perms: Readonly<CaseDomainPermissions>) => perms.canCreateTickets === true);
    });

    Then('it should return true', () => {
      expect(permissionResult).toBe(true);
    });
  });

  Scenario('Using visa to determine permissions for violation ticket', ({ Given, When, Then, And }) => {
    Given('I create a SystemCasePassport with canCreateTickets permission', () => {
      passport = new SystemCasePassport({ canCreateTickets: true });
    });

    And('I have a violation ticket V1 entity reference', () => {
      violationTicketRef = makeViolationTicketV1();
    });

    When('I get a visa for the violation ticket', () => {
      violationTicketVisa = passport.forViolationTicketV1(violationTicketRef);
    });

    And('I use determineIf to check if canCreateTickets is true', () => {
      permissionResult = violationTicketVisa.determineIf((perms: Readonly<CaseDomainPermissions>) => perms.canCreateTickets === true);
    });

    Then('it should return true', () => {
      expect(permissionResult).toBe(true);
    });
  });
});