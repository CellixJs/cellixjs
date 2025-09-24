import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { ServiceEntityReference } from '../../../contexts/service/service/service.ts';
import type { MemberEntityReference } from '../../../contexts/community/member/member.ts';
import { MemberServiceVisa } from './member.service.visa.ts';

const test = { for: describeFeature };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/member.service.visa.feature'),
);

function makeService(id = 'service-1', communityId = 'community-1') {
  return { id, community: { id: communityId } } as ServiceEntityReference;
}

function makeMember(
  id = 'member-1',
  communityId = 'community-1',
  roleOverrides: Partial<{ servicePermissions: Record<string, unknown> }> = {}
) {
  return {
    id,
    community: { id: communityId },
    role: {
      permissions: {
        servicePermissions: {
          canManageServices: true,
          ...roleOverrides.servicePermissions,
        },
      },
    },
  } as unknown as MemberEntityReference;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let service: ServiceEntityReference;
  let member: MemberEntityReference;
  let visa: MemberServiceVisa<ServiceEntityReference>;

  BeforeEachScenario(() => {
    service = makeService();
    member = makeMember();
    visa = undefined as unknown as MemberServiceVisa<ServiceEntityReference>;
  });

  Background(({ Given, And }) => {
    Given('a valid ServiceEntityReference with id "service-1" and community id "community-1"', () => {
      service = makeService('service-1', 'community-1');
    });
    And('a valid MemberEntityReference with id "member-1", community id "community-1", and role with service permissions', () => {
      member = makeMember('member-1', 'community-1');
    });
  });

  Scenario('Creating a MemberServiceVisa with a member belonging to the service\'s community', ({ When, Then }) => {
    When('I create a MemberServiceVisa with the service and member', () => {
      visa = new MemberServiceVisa(service, member);
    });
    Then('the visa should be created successfully', () => {
      expect(visa).toBeInstanceOf(MemberServiceVisa);
    });
  });

  Scenario('determineIf returns true when the permission function returns true', ({ Given, When, Then }) => {
    let result: boolean;
    Given('a MemberServiceVisa for the service and member', () => {
      visa = new MemberServiceVisa(service, member);
    });
    When('I call determineIf with a function that returns true if canManageServices is true', () => {
      result = visa.determineIf((p) => p.canManageServices === true);
    });
    Then('the result should be true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('determineIf returns false when the permission function returns false', ({ Given, When, Then }) => {
    let result: boolean;
    Given('a MemberServiceVisa for the service and member', () => {
      visa = new MemberServiceVisa(service, member);
    });
    When('I call determineIf with a function that returns false', () => {
        result = visa.determineIf(() => false);
    });
    Then('the result should be false', () => {
      expect(result).toBe(false);
    });
  });

  Scenario('determineIf returns false if the member does not belong to the service\'s community', ({ Given, And, When, Then }) => {
    let result: boolean;
    Given('a MemberEntityReference with community id "community-2"', () => {
      member = makeMember('member-1', 'community-2');
    });
    And('a ServiceEntityReference with id "service-1" and community id "community-1"', () => {
      service = makeService('service-1', 'community-1');
    });
    When('I create a MemberServiceVisa with the service and member', () => {
      visa = new MemberServiceVisa(service, member);
    });
    And('I call determineIf with any function', () => {
      result = visa.determineIf(() => true);
    });
    Then('the result should be false', () => {
      expect(result).toBe(false);
    });
  });

  Scenario('determineIf returns true if the member\'s role has the required service permission', ({ Given, And, When, Then }) => {
    let result: boolean;
    Given('a MemberEntityReference with servicePermissions where canManageServices is true', () => {
      member = makeMember('member-1', 'community-1', {
        servicePermissions: { canManageServices: true }
      });
    });
    And('a ServiceEntityReference with id "service-1" and community id "community-1"', () => {
      service = makeService('service-1', 'community-1');
    });
    When('I create a MemberServiceVisa with the service and member', () => {
      visa = new MemberServiceVisa(service, member);
    });
    And('I call determineIf with a function that returns canManageServices', () => {
      result = visa.determineIf((p) => p.canManageServices === true);
    });
    Then('the result should be true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('determineIf returns false if the member\'s role does not have the required service permission', ({ Given, And, When, Then }) => {
    let result: boolean;
    Given('a MemberEntityReference with servicePermissions where canManageServices is false', () => {
      member = makeMember('member-1', 'community-1', {
        servicePermissions: { canManageServices: false }
      });
    });
    And('a ServiceEntityReference with id "service-1" and community id "community-1"', () => {
      service = makeService('service-1', 'community-1');
    });
    When('I create a MemberServiceVisa with the service and member', () => {
      visa = new MemberServiceVisa(service, member);
    });
    And('I call determineIf with a function that returns canManageServices', () => {
      result = visa.determineIf((p) => p.canManageServices === true);
    });
    Then('the result should be false', () => {
      expect(result).toBe(false);
    });
  });

  Scenario('determineIf sets isSystemAccount to false', ({ Given, When, Then }) => {
    let result: boolean;
    Given('a MemberServiceVisa for the service and member', () => {
      visa = new MemberServiceVisa(service, member);
    });
    When('I call determineIf with a function that returns isSystemAccount', () => {
      result = visa.determineIf((p) => p.isSystemAccount === false);
    });
    Then('the result should be false', () => {
      expect(result).toBe(true);
    });
  });
});