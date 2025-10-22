import type { Model, Schema } from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { Base } from './base.ts';
import { modelFactory, type MongooseContextFactory } from './mongo-connection.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/mongo-connection.feature')
);

interface TestDoc extends Base {
  foo: string;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let mockService: {
    models: Record<string, unknown>;
    model: ReturnType<typeof vi.fn>;
  };
  let contextFactory: MongooseContextFactory;
  let schema: Schema<TestDoc, Model<TestDoc>, TestDoc>;
  let returnedModel: Model<TestDoc>;
  let fakeModel: Model<TestDoc>;

  BeforeEachScenario(() => {
    schema = {} as Schema<TestDoc, Model<TestDoc>, TestDoc>;
    fakeModel = {} as Model<TestDoc>;
  });

  Scenario('Returning an existing model', ({ Given, When, Then }) => {
    Given('an initialized service with a registered model', () => {
      mockService = {
        models: { TestModel: fakeModel },
        model: vi.fn(),
      };
      contextFactory = { service: mockService as unknown as MongooseContextFactory['service'] };
    });
    When('modelFactory is called with the model name and schema', () => {
      returnedModel = modelFactory<TestDoc>('TestModel', schema)(contextFactory);
    });
    Then('it should return the existing model from the service', () => {
      expect(returnedModel).toBe(fakeModel);
      expect(mockService.model).not.toHaveBeenCalled();
    });
  });

  Scenario('Registering and returning a new model', ({ Given, When, Then }) => {
    Given('an initialized service without the model registered', () => {
      mockService = {
        models: {},
        model: vi.fn().mockReturnValue(fakeModel),
      };
      contextFactory = { service: mockService as unknown as MongooseContextFactory['service'] };
    });
    When('modelFactory is called with the model name and schema', () => {
      returnedModel = modelFactory<TestDoc>('TestModel', schema)(contextFactory);
    });
    Then('it should register the model on the service and return it', () => {
      expect(mockService.model).toHaveBeenCalledWith('TestModel', schema);
      expect(returnedModel).toBe(fakeModel);
    });
  });
});
