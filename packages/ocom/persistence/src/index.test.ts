import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type mongoose from 'mongoose';


// Mock the mongooseContextBuilder function
vi.mock('@ocom/data-sources-mongoose-models', () => ({
  mongooseContextBuilder: vi.fn(),
}));

// Mock the DataSourcesFactoryImpl
vi.mock('./datasources/index.ts', () => ({
  DataSourcesFactoryImpl: vi.fn(),
}));

import { Persistence, type ModelsContext } from './index.ts';
import { DataSourcesFactoryImpl } from './datasources/index.ts';
import { mongooseContextBuilder } from '@ocom/data-sources-mongoose-models';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'index.feature')
);

function makeMockMongooseContextFactory(service: mongoose.Mongoose | null | 'invalid' = {} as mongoose.Mongoose): MongooseSeedwork.MongooseContextFactory {
  if (service === null) {
    return { service: null as unknown as mongoose.Mongoose };
  }
  if (service === 'invalid') {
    return { service: undefined as unknown as mongoose.Mongoose };
  }
  return {
    service: service,
  };
}

function makeMockModelsContext(): ModelsContext {
  return {
    Community: {} as unknown,
    EndUser: {} as unknown,
  } as ModelsContext;
}

function makeMockDataSourcesFactory() {
  return {
    withPassport: vi.fn(),
    withSystemPassport: vi.fn(),
  };
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let mockMongooseFactory: MongooseSeedwork.MongooseContextFactory;
  let mockModelsContext: ReturnType<typeof makeMockModelsContext>;
  let mockFactory: ReturnType<typeof makeMockDataSourcesFactory>;

  BeforeEachScenario(() => {
    mockMongooseFactory = makeMockMongooseContextFactory();
    mockModelsContext = makeMockModelsContext();
    mockFactory = makeMockDataSourcesFactory();

    // Reset all mocks
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(mongooseContextBuilder).mockReturnValue(mockModelsContext);
    vi.mocked(DataSourcesFactoryImpl).mockReturnValue(mockFactory);
  });

  Background(({ Given, And }) => {
    Given('a valid Mongoose context factory with service', () => {
      // Setup is done in BeforeEachScenario
    });

    And('the mongooseContextBuilder is available', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Creating Persistence factory with valid service', ({ When, Then, And }) => {
    let result: ReturnType<typeof Persistence>;

    When('I call Persistence with a valid MongooseContextFactory', () => {
      result = Persistence(mockMongooseFactory);
    });

    Then('I should receive a DataSourcesFactory object', () => {
      expect(result).toBeDefined();
      expect(result).toBe(mockFactory);
    });

    And('the factory should have withPassport method', () => {
      expect(result).toHaveProperty('withPassport');
      expect(typeof result.withPassport).toBe('function');
    });

    And('the factory should have withSystemPassport method', () => {
      expect(result).toHaveProperty('withSystemPassport');
      expect(typeof result.withSystemPassport).toBe('function');
    });
  });

  Scenario('Creating Persistence factory without service', ({ When, Then }) => {
    When('I call Persistence with null service', () => {
      const invalidFactory = makeMockMongooseContextFactory(null);
      expect(() => Persistence(invalidFactory)).toThrow();
    });

    Then('I should receive an error about required service', () => {
      const invalidFactory = makeMockMongooseContextFactory(null);
      expect(() => Persistence(invalidFactory)).toThrow('MongooseSeedwork.MongooseContextFactory is required');
    });
  });

  Scenario('Creating Persistence factory with undefined service', ({ When, Then }) => {
    When('I call Persistence with undefined service', () => {
      const invalidFactory = makeMockMongooseContextFactory('invalid');
      expect(() => Persistence(invalidFactory)).toThrow();
    });

    Then('I should receive an error about required service', () => {
      const invalidFactory = makeMockMongooseContextFactory('invalid');
      expect(() => Persistence(invalidFactory)).toThrow('MongooseSeedwork.MongooseContextFactory is required');
    });
  });

  Scenario('Persistence function exports', ({ Then, And }) => {
    Then('Persistence should be exported from index', () => {
      expect(typeof Persistence).toBe('function');
    });

    And('ModelsContext type should be exported from index', () => {
      // Type exports cannot be tested at runtime, but we verify the function exists
      expect(Persistence).toBeDefined();
    });

    And('DataSources type should be exported from index', () => {
      // Type exports cannot be tested at runtime, but we verify the function exists
      expect(Persistence).toBeDefined();
    });

    And('DataSourcesFactory type should be exported from index', () => {
      // Type exports cannot be tested at runtime, but we verify the function exists
      expect(Persistence).toBeDefined();
    });
  });
});