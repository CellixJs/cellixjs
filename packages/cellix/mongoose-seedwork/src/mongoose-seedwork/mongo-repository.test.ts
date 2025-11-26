import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import { CustomDomainEventImpl } from '@cellix/domain-seedwork/domain-event';
import type { TypeConverter } from '@cellix/domain-seedwork/type-converter';
import type { EventBus } from '@cellix/domain-seedwork/event-bus';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type mongoose from 'mongoose';
import { expect, type Mock, vi } from 'vitest';
import type { Base } from './base.ts';
import { MongoRepositoryBase } from './mongo-repository.ts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Minimal Base (MongoType)

const test = { for: describeFeature };
interface TestMongoType extends Base {
	foo: string;
}

// Minimal DomainEntityProps
interface TestProps {
	id: string;
	foo: string;
}
// biome-ignore lint/plugin/no-type-assertion: test file
const passport = vi.mocked({} as unknown);
// Minimal concrete AggregateRoot for testing
class DummyAggregateRoot extends AggregateRoot<
	TestProps,
	typeof passport
> {
	override onSave = vi.fn();
	// Expose protected methods as public for testing
	public override getDomainEvents() {
		return super.getDomainEvents();
	}
	public override clearDomainEvents() {
		return super.clearDomainEvents();
	}
	public override getIntegrationEvents() {
		return super.getIntegrationEvents();
	}
	public override clearIntegrationEvents() {
		return super.clearIntegrationEvents();
	}

	public requestDelete() {
		super.isDeleted = true;
	}
}

class TestDomainEvent1 extends CustomDomainEventImpl<{ foo: string }> {}
class TestDomainEvent2 extends CustomDomainEventImpl<{ foo: string }> {}

class TestIntegrationEvent1 extends CustomDomainEventImpl<{ id: string, foo: string }> {}
class TestIntegrationEvent2 extends CustomDomainEventImpl<{ id: string, foo: string }> {}


// All dependencies mocked with vi.mocked({})
const model = {
	findById: vi.fn().mockReturnValue({
		exec: vi.fn().mockResolvedValue({
			_id: 'test-id',
			foo: 'test-foo',
		}),
	}),
	deleteOne: vi.fn().mockReturnValue({
		exec: vi.fn().mockResolvedValue({}),
	}),
// biome-ignore lint/plugin/no-type-assertion: test file
} as unknown as mongoose.Model<TestMongoType>;
const typeConverter = vi.mocked({
	toDomain: vi.fn(),
	toAdapter: vi.fn(),
	toPersistence: vi.fn(),
// biome-ignore lint/plugin/no-type-assertion: test file
} as TypeConverter<
	TestMongoType,
	TestProps,
	typeof passport,
	DummyAggregateRoot
>);
const eventBus = vi.mocked({
	dispatch: vi.fn(),
	register: vi.fn(),
// biome-ignore lint/plugin/no-type-assertion: test file
} as EventBus);
// biome-ignore lint/plugin/no-type-assertion: test file
const session = vi.mocked({} as mongoose.ClientSession);

// Concrete repository for testing
class TestMongoRepository extends MongoRepositoryBase<
	TestMongoType,
	TestProps,
	typeof passport,
	DummyAggregateRoot
> {};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mongoRepositoryFeature = await loadFeature(path.resolve(__dirname, 'features/mongo-repository.feature'));

test.for(mongoRepositoryFeature, ({ Background, Scenario, BeforeEachScenario }) => {

  let repo: TestMongoRepository;
  let aggregate: DummyAggregateRoot;
  let props: TestProps;
  let domainEvent1: TestDomainEvent1 | undefined;
  let domainEvent2: TestDomainEvent2 | undefined;
  let mongoObj: { isModified: () => boolean; save: ReturnType<typeof vi.fn> } | undefined;
  let execSpy: ReturnType<typeof vi.fn> | undefined;
  let error: unknown;
  let domainObj: DummyAggregateRoot | undefined;
  let result: unknown;
  let thrownError: Error | undefined;

  BeforeEachScenario(() => {
	vi.clearAllMocks();
	repo = new TestMongoRepository(
	  passport,
	  model,
	  typeConverter,
	  eventBus,
	  session,
	);
	props = { id: 'test-id', foo: 'bar' };
	aggregate = new DummyAggregateRoot(props, passport);
	domainEvent1 = undefined;
	domainEvent2 = undefined;
	mongoObj = undefined;
	execSpy = undefined;
	error = undefined;
	domainObj = undefined;
	result = undefined;
	thrownError = undefined;
  });

  Background(({ Given }) => {
	Given('an initialized repository', () => {
	  repo = new TestMongoRepository(
		passport,
		model,
		typeConverter,
		eventBus,
		session,
	  );
	});
  });

  Scenario('Initializing the repository', ({ Given, When, Then }) => {
	Given('valid dependencies for a model and type converter', () => {return;});
	When('the constructor for MongoRepositoryBase is called', () => {
        repo = new TestMongoRepository(
          passport,
          model,
          typeConverter,
          eventBus,
          session,
        );
    });
	Then('it should construct with dependencies', () => {
	  expect(repo).toBeInstanceOf(TestMongoRepository);
      // biome-ignore lint:useLiteralKeys
	  expect(repo['model']).toBe(model);
      // biome-ignore lint:useLiteralKeys
	  expect(repo['typeConverter']).toBe(typeConverter);
      // biome-ignore lint:useLiteralKeys
	  expect(repo['bus']).toBe(eventBus);
      // biome-ignore lint:useLiteralKeys
	  expect(repo['session']).toBe(session);
      // biome-ignore lint:useLiteralKeys
	  expect(repo['passport']).toBe(passport);
	});
  });

  Scenario('Creating a repository instance with static create', ({ Given, When, Then }) => {
    let repoInstance: TestMongoRepository;
	Given('valid dependencies for a model and type converter', () => {return;});
	When('the static create method is called', () => {
    repoInstance = TestMongoRepository.create(
		passport,
		model,
		typeConverter,
		eventBus,
		session,
		TestMongoRepository,
	  );
    });
	Then('it should create an instance of the repository', () => {

	  expect(repoInstance).toBeInstanceOf(TestMongoRepository);
	});
  });

  Scenario('Saving a non-deleted aggregate', ({ When, Then, And }) => {
	When('the repository is saved with a non-deleted aggregate', async () => {
      domainEvent1 = new TestDomainEvent1('save-id');
      domainEvent1.payload = { foo: 'bar1' };
      domainEvent2 = new TestDomainEvent2('save-id');
      domainEvent2.payload = { foo: 'bar2' }
      ;
	  props = { id: 'save-id', foo: 'bar' };
	  aggregate = new DummyAggregateRoot(props, passport);
	  vi.spyOn(aggregate, 'getDomainEvents').mockReturnValue([
		domainEvent1,
		domainEvent2,
	  ]);
	  vi.spyOn(aggregate, 'clearDomainEvents').mockImplementation(() => []);
	  mongoObj = {
		isModified: () => true,
		save: vi.fn().mockResolvedValue({ _id: 'save-id', foo: 'bar' }),
	  };
	  // biome-ignore lint/plugin/no-type-assertion: test file
	  typeConverter.toPersistence.mockReturnValue(mongoObj as unknown as TestMongoType);
	  domainObj = new DummyAggregateRoot(props, passport);
	  typeConverter.toDomain.mockResolvedValueOnce(domainObj);
	  result = await repo.save(aggregate);
	});
	Then('it should dispatch all domain events before clearing them', () => {
	  const dispatchSpy = eventBus.dispatch;
	  expect(dispatchSpy).toHaveBeenCalledTimes(2);
	  expect(dispatchSpy).toHaveBeenNthCalledWith(1, TestDomainEvent1, domainEvent1?.payload);
	  expect(dispatchSpy).toHaveBeenNthCalledWith(2, TestDomainEvent2, domainEvent2?.payload);
	  // biome-ignore lint/plugin/no-type-assertion: test file
	  const clearDomainEventsSpy = aggregate.clearDomainEvents as unknown as Mock;
	  if (clearDomainEventsSpy && dispatchSpy.mock) {
		const lastDispatchCallOrder = dispatchSpy.mock.invocationCallOrder[1];
		const clearCallOrder = clearDomainEventsSpy.mock.invocationCallOrder[0];
		// biome-ignore lint/plugin/no-type-assertion: test file
		expect(clearCallOrder).toBeGreaterThan(lastDispatchCallOrder as number);
	  }
	});
	And('it should call the model save method for the aggregate and return the domain object', () => {
	  expect(aggregate.onSave).toHaveBeenCalledWith(true);
	  expect(eventBus.dispatch).toHaveBeenCalledWith(TestDomainEvent1, domainEvent1?.payload);
	  expect(aggregate.clearDomainEvents).toHaveBeenCalled();
	  expect(typeConverter.toPersistence).toHaveBeenCalledWith(aggregate);
	  expect(mongoObj?.save).toHaveBeenCalledWith({ session });
	  expect(typeConverter.toDomain).toHaveBeenCalled();
	  expect(result).toBe(domainObj);
      // biome-ignore lint:useLiteralKeys
	  expect(repo['itemsInTransaction']).toContain(aggregate);
	});
  });

  Scenario('Saving a deleted aggregate', ({ When, Then }) => {
	When('the repository is saved with a deleted aggregate', async () => {
	  props = { id: 'delete-id', foo: 'bar' };
	  aggregate = new DummyAggregateRoot(props, passport);
	  aggregate.requestDelete();
      domainEvent1 = new TestDomainEvent1('delete-id');
      domainEvent1.payload = { foo: 'bar' };
	  vi.spyOn(aggregate, 'getDomainEvents').mockReturnValue([domainEvent1]);
	  vi.spyOn(aggregate, 'clearDomainEvents').mockImplementation(() => []);
	  mongoObj = {
		isModified: () => true,
		save: vi.fn(),
	  };
	  // biome-ignore lint/plugin/no-type-assertion: test file
	  typeConverter.toPersistence.mockReturnValue(mongoObj as unknown as TestMongoType);
	  execSpy = vi.fn().mockResolvedValue({});
	  // biome-ignore lint/plugin/no-type-assertion: test file
	  (model.deleteOne as unknown as Mock).mockReturnValueOnce({ exec: execSpy });
	  result = await repo.save(aggregate);
	});
	Then('it should call the model delete method for the aggregate and return the aggregate', () => {
	  expect(aggregate.onSave).toHaveBeenCalledWith(true);
	  expect(eventBus.dispatch).toHaveBeenCalledWith(TestDomainEvent1, domainEvent1?.payload);
	  expect(aggregate.clearDomainEvents).toHaveBeenCalled();
	  expect(typeConverter.toPersistence).toHaveBeenCalledWith(aggregate);
	  expect(model.deleteOne).toHaveBeenCalledWith({ _id: 'delete-id' }, { session });
	  expect(execSpy).toHaveBeenCalled();
	  expect(result).toBe(aggregate);
      // biome-ignore lint:useLiteralKeys
	  expect(repo['itemsInTransaction']).toContain(aggregate);
	});
  });

  Scenario('Save operation fails', ({ When, Then }) => {
	When('the repository save operation fails', async () => {
	  props = { id: 'fail-id', foo: 'bar' };
	  aggregate = new DummyAggregateRoot(props, passport);
	  error = new Error('save failed');
	  mongoObj = {
		isModified: () => true,
		save: vi.fn().mockRejectedValue(error),
	  };
	  // biome-ignore lint/plugin/no-type-assertion: test file
	  typeConverter.toPersistence.mockReturnValue(mongoObj as unknown as TestMongoType);
	  vi.spyOn(aggregate, 'getDomainEvents').mockReturnValue([]);
	  vi.spyOn(aggregate, 'clearDomainEvents').mockImplementation(() => []);
	  try {
		await repo.save(aggregate);
	  } catch (err: unknown) {
		// biome-ignore lint/plugin/no-type-assertion: test file
		thrownError = err as Error;
	  }
	});
	Then('it should throw if mongoObj.save throws', () => {
	  expect(thrownError).toBeInstanceOf(Error);
	  expect(thrownError?.message).toBe('save failed');
	});
  });

  Scenario('Save operation correctly dispatches domain events', ({ Given, When, Then }) => {
	Given('a repository with an aggregate that has domain events', () => {
	  props = { id: 'event-id', foo: 'bar' };
	  aggregate = new DummyAggregateRoot(props, passport);
	  domainEvent1 = new TestDomainEvent1('event-id');
	  domainEvent1.payload = { foo: 'bar' };
	  vi.spyOn(aggregate, 'getDomainEvents').mockReturnValue([domainEvent1]);
	  vi.spyOn(aggregate, 'clearDomainEvents').mockImplementation(() => []);
	  mongoObj = {
		isModified: () => true,
		save: vi.fn().mockResolvedValue({ _id: 'event-id', foo: 'bar' }),
	  };
	  // biome-ignore lint/plugin/no-type-assertion: test file
	  typeConverter.toPersistence.mockReturnValue(mongoObj as unknown as TestMongoType);
	  domainObj = new DummyAggregateRoot(props, passport);
	  typeConverter.toDomain.mockResolvedValueOnce(domainObj);
	});
	When('the repository saves the aggregate', async () => {
	  result = await repo.save(aggregate);
	});
	Then('it should dispatch all domain events using the event dispatcher', () => {
	  expect(eventBus.dispatch).toHaveBeenCalledWith(TestDomainEvent1, domainEvent1?.payload);
	});
  });

  Scenario('Save operation correctly fails when domain event handler fails', ({ Given, And, When, Then }) => {
	Given('a repository with an aggregate that has a domain event', () => {
	  props = { id: 'fail-event-id', foo: 'bar' };
	  aggregate = new DummyAggregateRoot(props, passport);
	  domainEvent1 = new TestDomainEvent1('fail-event-id');
	  domainEvent1.payload = { foo: 'bar' };
	  vi.spyOn(aggregate, 'getDomainEvents').mockReturnValueOnce([domainEvent1]);
	  vi.spyOn(aggregate, 'clearDomainEvents').mockImplementationOnce(() => []);
	  mongoObj = {
		isModified: () => true,
		save: vi.fn().mockResolvedValueOnce({ _id: 'fail-event-id', foo: 'bar' }),
	  };
	  // biome-ignore lint/plugin/no-type-assertion: test file
	  (typeConverter.toPersistence as unknown as Mock).mockReturnValueOnce(mongoObj);
	  domainObj = new DummyAggregateRoot(props, passport);
	  // biome-ignore lint/plugin/no-type-assertion: test file
	  (typeConverter.toDomain as unknown as Mock).mockResolvedValueOnce(domainObj);
	});
	And('a domain event handler that throws an error', () => {
	  error = new Error('handler failed');
	  eventBus.dispatch.mockRejectedValueOnce(error);
	});
	When('the repository saves the aggregate', async () => {
	  try {
		await repo.save(aggregate);
	  } catch (err) {
		// biome-ignore lint/plugin/no-type-assertion: test file
		thrownError = err as Error;
	  }
	});
	Then('it should propagate the error from the domain event handler', () => {
	  expect(thrownError).toBe(error);
	});
  });

Scenario('Getting an aggregate that exists', ({ When, Then }) => {
  When('the repository gets an aggregate that exists', async () => {
    // removing this causes two tests to fail - result shows data from previous scenario, unknown cause
    vi.resetAllMocks();
    const testId = 'test-id';
    const mongoDoc = { _id: testId, foo: 'test-foo' };
    // biome-ignore lint/plugin/no-type-assertion: test file
    (model.findById as unknown as Mock).mockReturnValueOnce({
      exec: vi.fn().mockResolvedValue(mongoDoc),
    });
    // Create a new instance for this scenario
    domainObj = new DummyAggregateRoot({ id: testId, foo: 'test-foo' }, passport);
    // biome-ignore lint/plugin/no-type-assertion: test file
    (typeConverter.toDomain as unknown as Mock).mockResolvedValueOnce(domainObj);
    result = await repo.get(testId);
  });
  Then('it should return the domain object if found', () => {
    expect(result).toBe(domainObj);
  });
});

  Scenario('Getting an aggregate that does not exist', ({ When, Then }) => {
	When('the repository gets an aggregate that does not exist', async () => {
	  const testId = 'not-found-id';
	  // biome-ignore lint/plugin/no-type-assertion: test file
	  (model.findById as unknown as Mock).mockReturnValueOnce({
		exec: vi.fn().mockResolvedValue(null),
	  });
	  try {
		await repo.get(testId);
	  } catch (err) {
		// biome-ignore lint/plugin/no-type-assertion: test file
		thrownError = err as Error;
	  }
	});
	Then('it should throw NotFoundError if the document is not found', () => {
	  expect(thrownError).toBeInstanceOf(NotFoundError);
	  expect(thrownError?.message).toBe('Item with id not-found-id not found');
	});
  });

  Scenario('Domain conversion fails on get', ({ When, Then }) => {
	When('the repository gets an aggregate root and the domain conversion fails', async () => {
	  const testId = 'test-id';
	  const mongoDoc = { _id: testId, foo: 'test-foo' };
	  // biome-ignore lint/plugin/no-type-assertion: test file
	  (model.findById as unknown as Mock).mockReturnValueOnce({
		exec: vi.fn().mockResolvedValue(mongoDoc),
	  });
	  error = new Error('conversion error');
	  typeConverter.toDomain.mockRejectedValueOnce(error);
	  try {
		await repo.get(testId);
	  } catch (err) {
		// biome-ignore lint/plugin/no-type-assertion: test file
		thrownError = err as Error;
	  }
	});
	Then('it should propagate errors thrown by typeConverter.toDomain', () => {
	  expect(thrownError).toBe(error);
	});
  });

  Scenario('Persistence layer fails on get', ({ When, Then }) => {
	When('the repository gets an aggregate root that does exist and the persistence layer fails', async () => {
	  const testId = 'error-id';
	  error = new Error('db error');
	  // biome-ignore lint/plugin/no-type-assertion: test file
	  (model.findById as unknown as Mock).mockReturnValueOnce({
		exec: vi.fn().mockRejectedValue(error),
	  });
	  try {
		await repo.get(testId);
	  } catch (err) {
		// biome-ignore lint/plugin/no-type-assertion: test file
		thrownError = err as Error;
	  }
	});
	Then('it should propagate errors thrown by model.findById().exec()', () => {
	  expect(thrownError).toBe(error);
	});
  });

  Scenario('Getting integration events with events present', ({ Given, When, Then }) => {
    let event1: TestIntegrationEvent1;
    let event2: TestIntegrationEvent2;
	Given('an initialized repository with aggregates in itemsInTransaction', () => {
	  event1 = new TestIntegrationEvent1('id1');
      event1.payload = { id: 'id1', foo: 'bar1' };
	  event2 = new TestIntegrationEvent2('id2');
      event2.payload = { id: 'id2', foo: 'bar2' };
	  const aggregate1 = new DummyAggregateRoot({ id: 'id1', foo: 'bar1' }, passport);
	  const aggregate2 = new DummyAggregateRoot({ id: 'id2', foo: 'bar2' }, passport);
	  vi.spyOn(aggregate1, 'getIntegrationEvents').mockReturnValue([event1]);
	  vi.spyOn(aggregate2, 'getIntegrationEvents').mockReturnValue([event2]);
	  vi.spyOn(aggregate1, 'clearIntegrationEvents');
	  vi.spyOn(aggregate2, 'clearIntegrationEvents');
      // biome-ignore lint:useLiteralKeys
	  repo['itemsInTransaction'] = [aggregate1, aggregate2];
	});
	When('getIntegrationEvents is called and aggregates have integration events', () => {
	  result = repo.getIntegrationEvents();
	});
	Then('it should return all integration events and clear them from each aggregate', () => {
	  expect(result).toEqual([
		event1,
		event2,
	  ]);
      // biome-ignore lint:useLiteralKeys
	  for (const agg of repo['itemsInTransaction']) {
		expect(agg.clearIntegrationEvents).toHaveBeenCalled();
	  }
	});
  });

  Scenario('Getting integration events with no events present', ({ Given, When, Then }) => {
	Given('an initialized repository with aggregates in itemsInTransaction', () => {
	  const aggregate1 = new DummyAggregateRoot({ id: 'id1', foo: 'bar1' }, passport);
	  const aggregate2 = new DummyAggregateRoot({ id: 'id2', foo: 'bar2' }, passport);
	  vi.spyOn(aggregate1, 'getIntegrationEvents').mockReturnValue([]);
	  vi.spyOn(aggregate2, 'getIntegrationEvents').mockReturnValue([]);
	  vi.spyOn(aggregate1, 'clearIntegrationEvents');
	  vi.spyOn(aggregate2, 'clearIntegrationEvents');
      // biome-ignore lint:useLiteralKeys
	  repo['itemsInTransaction'] = [aggregate1, aggregate2];
	});
	When('getIntegrationEvents is called and aggregates have no integration events', () => {
	  result = repo.getIntegrationEvents();
	});
	Then('it should return an empty array and clear integration events from each aggregate', () => {
	  expect(result).toEqual([]);
      // biome-ignore lint:useLiteralKeys
	  for (const agg of repo['itemsInTransaction']) {
		expect(agg.clearIntegrationEvents).toHaveBeenCalled();
	  }
	});
  });
});
