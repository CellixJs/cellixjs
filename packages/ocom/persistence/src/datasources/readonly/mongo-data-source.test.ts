import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { Model } from 'mongoose';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { MongoDataSourceImpl, type MongoDataSource } from './mongo-data-source.ts';

// Mock mongoose Model and isValidObjectId

const test = { for: describeFeature };
vi.mock('mongoose', () => ({
  Model: vi.fn(),
  isValidObjectId: vi.fn((id: string) => id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)),
}));

// Define a test document type
interface TestDocument extends MongooseSeedwork.Base {
  name: string;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'mongo-data-source.feature')
);

function makeMockModel() {
  return {
    find: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    aggregate: vi.fn(),
  } as unknown as Model<TestDocument>;
}

const MOCK_ID_ONE = '507f1f77bcf86cd799439011';
const MOCK_ID_TWO = '507f1f77bcf86cd799439012';

function makeMockLeanDocument(): TestDocument {
  return {
    _id: new MongooseSeedwork.ObjectId(MOCK_ID_ONE),
    name: 'test-doc',
    value: 42,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),
  } as TestDocument;
}

function makeMockLeanDocuments(): TestDocument[] {
  return [
    makeMockLeanDocument(),
    {
      _id: new MongooseSeedwork.ObjectId(MOCK_ID_TWO),
      name: 'test-doc-2',
      value: 24,
      createdAt: new Date('2023-01-02'),
      updatedAt: new Date('2023-01-03'),
    } as TestDocument,
  ];
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let model: Model<TestDocument>;
  let dataSource: MongoDataSource<TestDocument>;
  let mockLeanDoc: TestDocument;
  let mockLeanDocs: TestDocument[];

  BeforeEachScenario(() => {
    model = makeMockModel();
    mockLeanDoc = makeMockLeanDocument();
    mockLeanDocs = makeMockLeanDocuments();

    // Reset all mocks
    vi.clearAllMocks();

    dataSource = new MongoDataSourceImpl(model);
  });

  Scenario('Creating Mongo Data Source Implementation', ({ When, Then, And }) => {
    When('I create a MongoDataSourceImpl with a Mongoose model', () => {
      // Data source is already created in BeforeEachScenario
    });

    Then('I should receive a MongoDataSource instance', () => {
      expect(dataSource).toBeDefined();
      expect(dataSource).toBeInstanceOf(MongoDataSourceImpl);
    });

    And('the instance should have all required methods', () => {
      expect(typeof dataSource.find).toBe('function');
      expect(typeof dataSource.findOne).toBe('function');
      expect(typeof dataSource.findById).toBe('function');
      expect(typeof dataSource.aggregate).toBe('function');
    });
  });

  Scenario('Finding documents with filter', ({ Given, When, Then }) => {
    Given('a Mongoose model with find method', () => {
      vi.mocked(model.find).mockReturnValue({
        lean: vi.fn().mockResolvedValue([mockLeanDoc]),
      } as unknown as ReturnType<Model<TestDocument>['find']>);
    });

    When('I call find with a filter object', async () => {
      await dataSource.find({ name: 'test-doc' });
    });

    Then('I should receive an array of documents with id field appended', async () => {
      const result = await dataSource.find({ name: 'test-doc' });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...mockLeanDoc,
        id: mockLeanDoc._id,
      });
      expect(model.find).toHaveBeenCalledWith({ name: 'test-doc' }, {}, {});
    });
  });

  Scenario('Finding documents with options', ({ Given, When, Then }) => {
    Given('a Mongoose model with find method', () => {
      vi.mocked(model.find).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockLeanDocs),
      } as unknown as ReturnType<Model<TestDocument>['find']>);
    });

    When('I call find with filter and options including limit, skip, and sort', async () => {
      await dataSource.find(
        { value: { $gt: 20 } } as unknown as Partial<TestDocument>,
        {
          limit: 10,
          skip: 5,
          sort: { createdAt: -1 },
        }
      );
    });

    Then('I should receive filtered and sorted documents', async () => {
      const result = await dataSource.find(
        { value: { $gt: 20 } } as unknown as Partial<TestDocument>,
        {
          limit: 10,
          skip: 5,
          sort: { createdAt: -1 },
        }
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toBeDefined();
      expect(result[1]).toBeDefined();
      // TypeScript knows result has 2 elements after toHaveLength(2)
      const typedResult = result as Array<{ id: string; _id: MongooseSeedwork.ObjectId }>;
      expect(typedResult[0]?.id).toBe(mockLeanDocs[0]?._id);
      expect(typedResult[1]?.id).toBe(mockLeanDocs[1]?._id);
      expect(model.find).toHaveBeenCalledWith(
        { value: { $gt: 20 } },
        {},
        { limit: 10, skip: 5, sort: { createdAt: -1 } }
      );
    });
  });

  Scenario('Finding documents with projection', ({ Given, When, Then }) => {
    Given('a Mongoose model with find method', () => {
      vi.mocked(model.find).mockReturnValue({
        lean: vi.fn().mockResolvedValue([mockLeanDoc]),
      } as unknown as ReturnType<Model<TestDocument>['find']>);
    });

    When('I call find with filter and projection options', async () => {
      await dataSource.find(
        { name: 'test-doc' },
        {
          fields: ['name', 'value'],
          projectionMode: 'include',
        }
      );
    });

    Then('I should receive documents with specified fields only', async () => {
      const result = await dataSource.find(
        { name: 'test-doc' },
        {
          fields: ['name', 'value'],
          projectionMode: 'include',
        }
      );
      expect(result).toHaveLength(1);
      expect(model.find).toHaveBeenCalledWith(
        { name: 'test-doc' },
        { name: 1, value: 1 },
        {}
      );
    });
  });

  Scenario('Finding one document', ({ Given, When, Then }) => {
    Given('a Mongoose model with findOne method', () => {
      vi.mocked(model.findOne).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockLeanDoc),
      } as unknown as ReturnType<Model<TestDocument>['findOne']>);
    });

    When('I call findOne with a filter', async () => {
      await dataSource.findOne({ name: 'test-doc' });
    });

    Then('I should receive a single document or null', async () => {
      const result = await dataSource.findOne({ name: 'test-doc' });
      expect(result).toEqual({
        ...mockLeanDoc,
        id: mockLeanDoc._id,
      });
      expect(model.findOne).toHaveBeenCalledWith({ name: 'test-doc' }, {});
    });
  });

  Scenario('Finding one document with population', ({ Given, When, Then }) => {
    Given('a Mongoose model with findOne method', () => {
      vi.mocked(model.findOne).mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockLeanDoc),
      } as unknown as ReturnType<Model<TestDocument>['findOne']>);
    });

    When('I call findOne with filter and populateFields option', async () => {
      await dataSource.findOne(
        { name: 'test-doc' },
        { populateFields: ['author', 'comments'] }
      );
    });

    Then('I should receive a document with populated fields', async () => {
      const result = await dataSource.findOne(
        { name: 'test-doc' },
        { populateFields: ['author', 'comments'] }
      );
      expect(result).toEqual({
        ...mockLeanDoc,
        id: mockLeanDoc._id,
      });
      expect(model.findOne).toHaveBeenCalledWith({ name: 'test-doc' }, {});
    });
  });

  Scenario('Finding document by valid ID', ({ Given, When, Then }) => {
    Given('a Mongoose model with findById method', () => {
      vi.mocked(model.findById).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockLeanDoc),
      } as unknown as ReturnType<Model<TestDocument>['findById']>);
    });

    When('I call findById with a valid ObjectId string', async () => {
      await dataSource.findById('507f1f77bcf86cd799439011');
    });

    Then('I should receive the document with id field appended', async () => {
      const result = await dataSource.findById('507f1f77bcf86cd799439011');
      expect(result).toEqual({
        ...mockLeanDoc,
        id: mockLeanDoc._id,
      });
      expect(model.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {});
    });
  });

  Scenario('Finding document by invalid ID', ({ Given, When, Then }) => {
    Given('a Mongoose model with findById method', () => {
      // Model should not be called for invalid ObjectId
    });

    When('I call findById with an invalid ObjectId string', async () => {
      await dataSource.findById('invalid-id');
    });

    Then('I should receive null', async () => {
      const result = await dataSource.findById('invalid-id');
      expect(result).toBeNull();
      expect(model.findById).not.toHaveBeenCalled();
    });
  });

  Scenario('Finding document by ID with population', ({ Given, When, Then }) => {
    Given('a Mongoose model with findById method', () => {
      vi.mocked(model.findById).mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockLeanDoc),
      } as unknown as ReturnType<Model<TestDocument>['findById']>);
    });

    When('I call findById with valid ID and populateFields option', async () => {
      await dataSource.findById('507f1f77bcf86cd799439011', {
        populateFields: ['author'],
      });
    });

    Then('I should receive the document with populated fields', async () => {
      const result = await dataSource.findById('507f1f77bcf86cd799439011', {
        populateFields: ['author'],
      });
      expect(result).toEqual({
        ...mockLeanDoc,
        id: mockLeanDoc._id,
      });
      expect(model.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {});
    });
  });

  Scenario('Aggregating documents', ({ Given, When, Then }) => {
    Given('a Mongoose model with aggregate method', () => {
      vi.mocked(model.aggregate).mockReturnValue({
        exec: vi.fn().mockResolvedValue([mockLeanDoc]),
      } as unknown as ReturnType<Model<TestDocument>['aggregate']>);
    });

    When('I call aggregate with a pipeline', async () => {
      await dataSource.aggregate([
        { $match: { value: { $gt: 20 } } },
        { $sort: { createdAt: -1 } },
      ]);
    });

    Then('I should receive aggregated results with id field appended', async () => {
      const result = await dataSource.aggregate([
        { $match: { value: { $gt: 20 } } },
        { $sort: { createdAt: -1 } },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...mockLeanDoc,
        id: mockLeanDoc._id,
      });
      expect(model.aggregate).toHaveBeenCalledWith([
        { $match: { value: { $gt: 20 } } },
        { $sort: { createdAt: -1 } },
      ]);
    });
  });
});