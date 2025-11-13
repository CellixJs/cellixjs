import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Passport } from '@ocom/domain';
import type { ModelsContext } from '../index.ts';
import type { DomainDataSource } from '@ocom/domain';
import type { ReadonlyDataSource } from './readonly/index.ts';

// Mock the domain data source implementation
vi.mock('./domain/index.ts', () => ({
  DomainDataSourceImplementation: vi.fn(),
}));

// Mock the readonly data source implementation
vi.mock('./readonly/index.ts', () => ({
  ReadonlyDataSourceImplementation: vi.fn(),
}));

// Mock the Domain module for PassportFactory
vi.mock('@ocom/domain', () => ({
  Domain: {
    PassportFactory: {
      forSystem: vi.fn(),
    },
  },
}));

import { DataSourcesFactoryImpl } from './index.ts';
import { DomainDataSourceImplementation } from './domain/index.ts';
import { ReadonlyDataSourceImplementation } from './readonly/index.ts';


import { Community } from '@ocom/domain/contexts/community/community';
import { Member } from '@ocom/domain/contexts/community/member';
import { EndUserRole } from '@ocom/domain/contexts/community/role/end-user-role';
import { VendorUserRole } from '@ocom/domain/contexts/community/role/vendor-user-role';
import { EndUser } from '@ocom/domain/contexts/user/end-user';
import { StaffRole } from '@ocom/domain/contexts/user/staff-role';
import { StaffUser } from '@ocom/domain/contexts/user/staff-user';
import { VendorUser } from '@ocom/domain/contexts/user/vendor-user';
const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'index.feature')
);

function makeMockModelsContext() {
  return {
    Community: {
      Community: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
        aggregate: vi.fn(),
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
        aggregate: vi.fn(),
      } as unknown as Models.User.EndUserModelType,
      StaffUser: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
      } as unknown as Models.User.StaffUserModelType,
      VendorUser: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
      } as unknown as Models.User.VendorUserModelType,
    },
  } as ModelsContext;
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
      forStaffRole: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
      forVendorUser: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Passport;
}

function makeMockDataSources() {
  return {
    domainDataSource: {
      Community: {
        Community: {
          CommunityUnitOfWork: {},
        },
        Member: {},
        Role: { EndUserRole: {}, VendorUserRole: {} },
      },
  User: { EndUser: {}, StaffRole: {}, StaffUser: {}, VendorUser: {} },
    } as unknown as PassportDataSource,
    readonlyDataSource: {
      Community: {
        Community: {
          CommunityReadRepo: {
            getAll: vi.fn(),
            getById: vi.fn(),
            getByIdWithCreatedBy: vi.fn(),
            getByEndUserExternalId: vi.fn(),
          },
        },
        Member: {
          MemberReadRepo: {
            getByCommunityId: vi.fn(),
            getById: vi.fn(),
            getByIdWithRole: vi.fn(),
            getMembersForEndUserExternalId: vi.fn(),
            isAdmin: vi.fn(),
          },
        },
      },
      User: {
        EndUser: {
          EndUserReadRepo: {
            getById: vi.fn(),
            getByExternalId: vi.fn(),
            getByIdWithCommunities: vi.fn(),
          },
        },
        StaffRole: {
          StaffRoleReadRepo: {
            getById: vi.fn(),
            getByRoleName: vi.fn(),
          },
        },
      },
    } as unknown as ReadonlyDataSource,
  };
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let models: ModelsContext;
  let passport: Passport;
  let factory: ReturnType<typeof DataSourcesFactoryImpl>;
  let mockDataSources: ReturnType<typeof makeMockDataSources>;

  BeforeEachScenario(() => {
    models = makeMockModelsContext();
    passport = makeMockPassport();
    mockDataSources = makeMockDataSources();

    // Mock the implementations using vi.mocked
    vi.mocked(DomainDataSourceImplementation).mockReturnValue(mockDataSources.domainDataSource);
    vi.mocked(ReadonlyDataSourceImplementation).mockReturnValue(mockDataSources.readonlyDataSource);

    // Mock the system passport
    vi.mocked(PassportFactory.forSystem).mockReturnValue(passport);

    factory = DataSourcesFactoryImpl(models);
  });

  Background(({ Given, And }) => {
    Given('a valid models context with all domain and readonly models', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid passport for domain operations', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Creating Data Sources Factory Implementation', ({ When, Then, And }) => {
    When('I call DataSourcesFactoryImpl with models', () => {
      // Factory is already created in BeforeEachScenario
    });

    Then('I should receive a DataSourcesFactory object', () => {
      expect(factory).toBeDefined();
      expect(typeof factory).toBe('object');
    });

    And('the DataSourcesFactory should have withPassport method', () => {
      expect(factory).toHaveProperty('withPassport');
      expect(typeof factory.withPassport).toBe('function');
    });

    And('the DataSourcesFactory should have withSystemPassport method', () => {
      expect(factory).toHaveProperty('withSystemPassport');
      expect(typeof factory.withSystemPassport).toBe('function');
    });
  });

  Scenario('Using withPassport method', ({ When, Then, And }) => {
    let result: ReturnType<typeof factory.withPassport>;

    When('I call withPassport with a passport', () => {
      result = factory.withPassport(passport);
    });

    Then('I should receive a DataSources object', () => {
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    And('the DataSources should have domainDataSource property', () => {
      expect(result).toHaveProperty('domainDataSource');
      expect(result.domainDataSource).toBe(mockDataSources.domainDataSource);
    });

    And('the DataSources should have readonlyDataSource property', () => {
      expect(result).toHaveProperty('readonlyDataSource');
      expect(result.readonlyDataSource).toBe(mockDataSources.readonlyDataSource);
    });
  });

  Scenario('Using withSystemPassport method', ({ When, Then, And }) => {
    let result: ReturnType<typeof factory.withSystemPassport>;

    When('I call withSystemPassport', () => {
      result = factory.withSystemPassport();
    });

    Then('I should receive a DataSources object with system passport', () => {
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    And('the DataSources should have domainDataSource property', () => {
      expect(result).toHaveProperty('domainDataSource');
      expect(result.domainDataSource).toBe(mockDataSources.domainDataSource);
    });

    And('the DataSources should have readonlyDataSource property', () => {
      expect(result).toHaveProperty('readonlyDataSource');
      expect(result.readonlyDataSource).toBe(mockDataSources.readonlyDataSource);
    });
  });

  Scenario('DataSourcesFactoryImpl exports', ({ Then, And }) => {
    Then('DataSourcesFactoryImpl should be exported from index', () => {
      expect(typeof DataSourcesFactoryImpl).toBe('function');
    });

    And('DataSources type should be exported from index', () => {
      // Type exports cannot be tested at runtime, but we verify the factory function exists
      expect(DataSourcesFactoryImpl).toBeDefined();
    });

    And('DataSourcesFactory type should be exported from index', () => {
      // Type exports cannot be tested at runtime, but we verify the factory function exists
      expect(DataSourcesFactoryImpl).toBeDefined();
    });
  });
});