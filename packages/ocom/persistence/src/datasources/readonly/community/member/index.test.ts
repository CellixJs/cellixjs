import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { Domain } from '@ocom/domain';
import { MemberReadRepositoryImpl } from './index.ts';
import { MemberDataSourceImpl, type MemberDataSource } from './member.data.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/index.feature')
);

// Mock the data source implementation
vi.mock('./member.data.ts', () => ({
  MemberDataSourceImpl: vi.fn(),
}));

function makeMockModelsContext() {
  return {
    Community: {
      Community: {} as unknown,
    },
    Member: {
      Member: {} as unknown,
    },
    Role: {
        EndUserRole: {} as unknown
    },
    User: {
      EndUser: {} as unknown,
    },
  } as unknown as Parameters<typeof MemberReadRepositoryImpl>[0];
}

function makeMockPassport() {
  return {
    community: {
      forCommunity: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Domain.Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let models: Parameters<typeof MemberReadRepositoryImpl>[0];
  let passport: Domain.Passport;
  let result: ReturnType<typeof MemberReadRepositoryImpl>;
  let mockDataSource: MemberDataSource;

  BeforeEachScenario(() => {
    models = makeMockModelsContext();
    passport = makeMockPassport();

    // Create a mock data source instance
    mockDataSource = {
      find: vi.fn(),
      findById: vi.fn(),
      findOne: vi.fn(),
      aggregate: vi.fn(),
    } as MemberDataSource;

    // Mock the constructor to return our mock data source
    vi.mocked(MemberDataSourceImpl).mockImplementation(() => mockDataSource as unknown as InstanceType<typeof MemberDataSourceImpl>);

    result = {} as ReturnType<typeof MemberReadRepositoryImpl>;
  });

  Background(({ Given, And }) => {
    Given('a valid models context with Member model', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid passport for domain operations', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Creating Member Read Repository Implementation', ({ When, Then, And }) => {
    When('I call MemberReadRepositoryImpl with models and passport', () => {
      result = MemberReadRepositoryImpl(models, passport);
    });

    Then('I should receive an object with MemberReadRepo property', () => {
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('MemberReadRepo');
    });

    And('the MemberReadRepo should be a MemberReadRepository instance', () => {
      expect(result.MemberReadRepo).toBeDefined();
      expect(typeof result.MemberReadRepo).toBe('object');
    });

    And('the MemberReadRepo should have all required methods', () => {
      expect(typeof result.MemberReadRepo.getByCommunityId).toBe('function');
      expect(typeof result.MemberReadRepo.getById).toBe('function');
      expect(typeof result.MemberReadRepo.getByIdWithRole).toBe('function');
      expect(typeof result.MemberReadRepo.getMembersForEndUserExternalId).toBe('function');
      expect(typeof result.MemberReadRepo.isAdmin).toBe('function');
    });
  });

  Scenario('MemberReadRepositoryImpl exports', ({ Then, And }) => {
    Then('MemberReadRepositoryImpl should be exported from index', () => {
      expect(typeof MemberReadRepositoryImpl).toBe('function');
    });

    And('MemberReadRepository type should be exported from index', () => {
      // Type exports cannot be tested at runtime, but we verify the function exists
      expect(MemberReadRepositoryImpl).toBeDefined();
    });
  });
});