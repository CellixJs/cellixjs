import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { Domain } from '@ocom/domain';
import { EndUserReadRepositoryImpl } from './index.ts';
import { EndUserDataSourceImpl, type EndUserDataSource } from './end-user.data.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/index.feature')
);

// Mock the data source implementation
vi.mock('./end-user.data.ts', () => ({
  EndUserDataSourceImpl: vi.fn(),
}));

function makeMockModelsContext() {
  return {
    Community: {
      Community: {} as unknown,
      Member: {} as unknown,
      EndUserRole: {} as unknown,
    },
    User: {
      EndUser: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
        aggregate: vi.fn(),
      },
    },
  } as unknown as Parameters<typeof EndUserReadRepositoryImpl>[0];
}

function makeMockPassport() {
  return {
    user: {
      forEndUser: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Domain.Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let models: Parameters<typeof EndUserReadRepositoryImpl>[0];
  let passport: Domain.Passport;
  let result: ReturnType<typeof EndUserReadRepositoryImpl>;
  let mockDataSource: EndUserDataSource;

  BeforeEachScenario(() => {
    models = makeMockModelsContext();
    passport = makeMockPassport();

    // Create a mock data source instance
    mockDataSource = {
      find: vi.fn(),
      findById: vi.fn(),
      findOne: vi.fn(),
      aggregate: vi.fn(),
    } as EndUserDataSource;

    // Mock the constructor to return our mock data source
    vi.mocked(EndUserDataSourceImpl).mockImplementation(() => mockDataSource as unknown as InstanceType<typeof EndUserDataSourceImpl>);

    result = {} as ReturnType<typeof EndUserReadRepositoryImpl>;
  });

  Background(({ Given, And }) => {
    Given('a valid models context with EndUser model', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid passport for domain operations', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Creating End User Read Repository Implementation', ({ When, Then, And }) => {
    When('I call EndUserReadRepositoryImpl with models and passport', () => {
      result = EndUserReadRepositoryImpl(models, passport);
    });

    Then('I should receive an object with EndUserReadRepo property', () => {
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('EndUserReadRepo');
    });

    And('the EndUserReadRepo should be an EndUserReadRepository instance', () => {
      expect(result.EndUserReadRepo).toBeDefined();
      expect(typeof result.EndUserReadRepo).toBe('object');
    });

    And('the EndUserReadRepo should have all required methods', () => {
      expect(typeof result.EndUserReadRepo.getAll).toBe('function');
      expect(typeof result.EndUserReadRepo.getById).toBe('function');
      expect(typeof result.EndUserReadRepo.getByExternalId).toBe('function');
      expect(typeof result.EndUserReadRepo.getByName).toBe('function');
    });
  });

  Scenario('EndUserReadRepositoryImpl exports', ({ Then, And }) => {
    Then('EndUserReadRepositoryImpl should be exported from index', () => {
      expect(typeof EndUserReadRepositoryImpl).toBe('function');
    });

    And('EndUserReadRepository type should be exported from index', () => {
      // Type exports cannot be tested at runtime, but we verify the function exists
      expect(EndUserReadRepositoryImpl).toBeDefined();
    });
  });
});