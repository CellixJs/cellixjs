import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';

import type { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { DomainDataSourceImplementation } from './index.ts';
import type { ServiceTicketModelType } from '@ocom/data-sources-mongoose-models/case/service-ticket';
import type { CommunityModelType } from '@ocom/data-sources-mongoose-models/community';
import type { MemberModelType } from '@ocom/data-sources-mongoose-models/member';
import type { PropertyModelType } from '@ocom/data-sources-mongoose-models/property';
import type { EndUserRoleModelType } from '@ocom/data-sources-mongoose-models/role/end-user-role';
import type { StaffRoleModelType } from '@ocom/data-sources-mongoose-models/role/staff-role';
import type { VendorUserRoleModelType } from '@ocom/data-sources-mongoose-models/role/vendor-user-role';
import type { ServiceModelType } from '@ocom/data-sources-mongoose-models/service';
import type { EndUserModelType } from '@ocom/data-sources-mongoose-models/user/end-user';
import type { StaffUserModelType } from '@ocom/data-sources-mongoose-models/user/staff-user';
import type { VendorUserModelType } from '@ocom/data-sources-mongoose-models/user/vendor-user';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'index.feature')
);

function makeMockModelsContext() {
  return {
    ServiceTicket: {
      findById: vi.fn(),
      find: vi.fn(),
      create: vi.fn(),
    } as unknown as ServiceTicketModelType,
    Community: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
      } as unknown as CommunityModelType,
    Member: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
      } as unknown as MemberModelType,
    EndUserRole: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
      } as unknown as EndUserRoleModelType,
      StaffRole: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
      } as unknown as StaffRoleModelType,
      VendorUserRole: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
      } as unknown as VendorUserRoleModelType,
    EndUser: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
      } as unknown as EndUserModelType,
      StaffUser: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
      } as unknown as StaffUserModelType,
      VendorUser: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
      } as unknown as VendorUserModelType,
    Property: {
            findById: vi.fn(),
            find: vi.fn(),
            create: vi.fn(),
        } as unknown as PropertyModelType,
    Service: {
            findById: vi.fn(),
            find: vi.fn(),
            create: vi.fn(),
        } as unknown as ServiceModelType,
  } as Parameters<typeof DomainDataSourceImplementation>[0];
}

function makeMockPassport() {
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
      forEndUser: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
      forStaffRole: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
      forStaffUser: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
      forVendorUser: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Domain.Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let models: Parameters<typeof DomainDataSourceImplementation>[0];
  let passport: Domain.Passport;
  let result: ReturnType<typeof DomainDataSourceImplementation>;

  BeforeEachScenario(() => {
    models = makeMockModelsContext();
    passport = makeMockPassport();
    result = {} as ReturnType<typeof DomainDataSourceImplementation>;
  });

  Background(({ Given, And }) => {
    Given('a valid models context with all domain models', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid passport for domain operations', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Creating Domain Data Source Implementation', ({ When, Then, And }) => {
    When('I call DomainDataSourceImplementation with models and passport', () => {
      result = DomainDataSourceImplementation(models, passport);
    });

    Then('I should receive a DomainDataSource object', () => {
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    And('the DomainDataSource should have Community property', () => {
      expect(result).toHaveProperty('Community');
      expect(typeof result.Community).toBe('object');
    });

    And('the DomainDataSource should have Property property', () => {
      expect(result).toHaveProperty('Property');
      expect(typeof result.Property).toBe('object');
    });

    And('the DomainDataSource should have Service property', () => {
      expect(result).toHaveProperty('Service');
      expect(typeof result.Service).toBe('object');
    });

    And('the DomainDataSource should have User property', () => {
      expect(result).toHaveProperty('User');
      expect(typeof result.User).toBe('object');
    });

    And('the Community property should have the correct structure', () => {
      expect(result.Community).toHaveProperty('Community');
      expect(result.Community).toHaveProperty('Member');
      expect(result.Community).toHaveProperty('Role');
      expect(result.Community.Role).toHaveProperty('EndUserRole');
      expect(result.Community.Role).toHaveProperty('VendorUserRole');
    });

    And('the User property should have the correct structure', () => {
      expect(result.User).toHaveProperty('EndUser');
      expect(result.User).toHaveProperty('StaffRole');
      expect(result.User).toHaveProperty('StaffUser');
      expect(result.User).toHaveProperty('VendorUser');
    });

    And('the Service property should have the correct structure', () => {
      expect(result.Service).toHaveProperty('Service');
    });
  });
});