import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { expect, vi } from 'vitest';
import { DomainDataSourceImplementation } from './index.ts';
// Direct imports from domain package
import type { Passport } from '@ocom/domain/contexts/passport';



const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'index.feature')
);

function makeMockModelsContext() {
  return {
    Case: {
        ServiceTicket: {
            findById: vi.fn(),
            find: vi.fn(),
            create: vi.fn(),
        } as unknown as Models.Case.ServiceTicketModelType,
    },
    Community: {
      Community: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
      } as unknown as Models.Community.CommunityModelType,
    },
    Member: {
      Member: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
      } as unknown as Models.Member.MemberModelType,
    },
    Role: {
      EndUserRole: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
      } as unknown as Models.Role.EndUserRoleModelType,
      StaffRole: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
      } as unknown as Models.Role.StaffRoleModelType,
      VendorUserRole: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
      } as unknown as Models.Role.VendorUserRoleModelType,
    },
    User: {
      EndUser: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
      } as unknown as Models.User.EndUserModelType,
      StaffUser: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
      } as unknown as Models.User.StaffUserModelType,
      StaffRole: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
      } as unknown as Models.Role.StaffRoleModelType,
      VendorUser: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
      } as unknown as Models.User.VendorUserModelType,
    },
    Property: {
        Property: {
            findById: vi.fn(),
            find: vi.fn(),
            create: vi.fn(),
        } as unknown as Models.Property.PropertyModelType,
    },
    Service: {
        Service: {
            findById: vi.fn(),
            find: vi.fn(),
            create: vi.fn(),
        } as unknown as Models.Service.ServiceModelType,
    }
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
  } as unknown as Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let models: Parameters<typeof DomainDataSourceImplementation>[0];
  let passport: Passport;
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