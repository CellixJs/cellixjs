import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Model, Schema } from 'mongoose';
import { expect, vi } from 'vitest';
import type { Base } from './base.ts';
import { modelFactory } from './mongo-connection.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/mongo-connection.feature')
);


interface MinimalMongooseService {
  models: Record<string, Model<TestDoc>>;
  model: (name: string, schema: Schema<TestDoc, Model<TestDoc>, TestDoc>) => Model<TestDoc>;
}

interface TestDoc extends Base {
  foo: string;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let mockService: MinimalMongooseService;
  let contextFactory: { service: MinimalMongooseService };
  let schema: Schema<TestDoc, Model<TestDoc>, TestDoc>;
  let returnedModel: Model<TestDoc>;
  let fakeModel: Model<TestDoc>;

  BeforeEachScenario(() => {
    schema = Object.create({});
    // Minimal mock for Model<TestDoc>
    fakeModel = Object.create({});
  });

  Scenario('Returning an existing model', ({ Given, When, Then }) => {
    Given('an initialized service with a registered model', () => {
      mockService = {
        models: { TestModel: fakeModel },
        model: vi.fn(),
      };
      contextFactory = { service: mockService };
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
      contextFactory = { service: mockService };
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
