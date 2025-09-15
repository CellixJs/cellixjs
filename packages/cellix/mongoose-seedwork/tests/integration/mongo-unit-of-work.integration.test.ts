import {
	describe,
	it,
	expect,
	beforeAll,
	afterAll,
	beforeEach,
	vi,
} from 'vitest';
import mongoose, { Schema, model, type Model } from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { DomainSeedwork } from '@cellix/domain-seedwork';
import {
	InProcEventBusInstance,
	NodeEventBusInstance,
} from '@cellix/event-bus-seedwork-node';
import { MongoUnitOfWork } from '../../src/mongoose-seedwork/mongo-unit-of-work';
import { MongoRepositoryBase } from '../../src/mongoose-seedwork/mongo-repository';
import { MongoTypeConverter } from '../../src/mongoose-seedwork/mongo-type-converter';
import type { Base } from '../../src/mongoose-seedwork/base';
import { MongooseDomainAdapter } from '../../src/mongoose-seedwork/mongo-domain-adapter';
// Import your DomainSeedwork and any other needed types

// 1. Define a minimal aggregate root and type converter for integration
interface TestProps {
	id: string;
	foo: string;
	bar?: string;
	baz?: string;
	createdAt: Date;
	updatedAt: Date;
	schemaVersion: string;
}
interface TestMongoType extends Base {
	foo: string;
	bar?: string;
	baz?: string;
	createdAt: Date;
	updatedAt: Date;
	schemaVersion: string;
}
class TestAggregate<
	props extends TestProps,
> extends DomainSeedwork.AggregateRoot<props, unknown> {
	static getNewInstance<props extends TestProps>(
		newProps: props,
		foo: string,
		passport: unknown,
	): TestAggregate<props> {
		console.log('getNewInstance called');
		const newInstance = new TestAggregate(newProps, passport);
		newInstance.foo = foo;
		return newInstance;
	}
	// Implement minimal aggregate root logic for integration
	get foo() {
		return this.props.foo;
	}
	set foo(foo: string) {
		this.props.foo = foo;
	}
	get bar() {
		return this.props.bar;
	}
	set bar(bar: string | undefined) {
		const oldBar = this.props.bar;
		if (oldBar !== bar && bar !== undefined) {
			if (bar === '') {
				throw new Error('Too short');
			}
			this.props.bar = bar;
			this.addDomainEvent(TestBarDomainEvent, {
				oldBar,
				bar: this.props.bar,
			});
		}
	}
	get baz() {
		return this.props.baz;
	}
	set baz(baz: string | undefined) {
		const oldBaz = this.props.baz;
		if (oldBaz !== baz && baz !== undefined) {
			this.props.baz = baz;
			this.addDomainEvent(TestBazDomainEvent, {
				oldBaz,
				baz: this.props.baz,
			});
		}
	}
}

const TestSchema = new Schema<TestMongoType>({
	foo: { type: String, required: true },
	bar: { type: String, required: false },
	baz: { type: String, required: false },
	createdAt: Date,
	updatedAt: Date,
	schemaVersion: String,
});
let TestModel: Model<TestMongoType>;

// 2. Minimal type converter for integration
/**
 * TypeConverter implementation for TestAggregate and TestMongoType.
 * This converter uses the MongoTypeConverter abstract class to provide realistic
 * conversion between the domain aggregate and the Mongoose model for integration tests.
 */
class TestAdapter
	extends MongooseDomainAdapter<TestMongoType>
	implements TestProps
{
	get foo(): string {
		return this.doc.foo;
	}
	set foo(value: string) {
		this.doc.foo = value;
	}
	get bar(): string | undefined {
		return this.doc.bar;
	}
	set bar(value: string | undefined) {
		this.doc.bar = value;
	}
	get baz(): string | undefined {
		return this.doc.baz;
	}
	set baz(value: string | undefined) {
		this.doc.baz = value;
	}
}

class TestTypeConverter extends MongoTypeConverter<
	TestMongoType,
	TestAdapter,
	unknown,
	TestAggregate<TestAdapter>
> {
	constructor() {
		super(TestAdapter, TestAggregate);
	}
}

const typeConverter = new TestTypeConverter();

class TestBarDomainEvent extends DomainSeedwork.CustomDomainEventImpl<{
	oldBar?: string;
	bar: string;
}> {}
class TestBazDomainEvent extends DomainSeedwork.CustomDomainEventImpl<{
	oldBaz?: string;
	baz: string;
}> {}

class TestRepo extends MongoRepositoryBase<
	TestMongoType,
	TestAdapter,
	unknown,
	TestAggregate<TestAdapter>
> {
	getNewInstance(foo: string): TestAggregate<TestAdapter> {
		const adapter = typeConverter.toAdapter(new this.model());
		return TestAggregate.getNewInstance(adapter, foo, this.passport);
	}
}
const repoClass = TestRepo;

// 3. Minimal event bus for integration
const eventBus = InProcEventBusInstance;
const integrationEventBus = NodeEventBusInstance;

let mongoServer: MongoMemoryReplSet;
let uow: MongoUnitOfWork<
	TestMongoType,
	TestAdapter,
	unknown,
	TestAggregate<TestAdapter>,
	TestRepo
>;
describe('MongoUnitOfWork:Integration', () => {
	beforeAll(async () => {
		mongoServer = await MongoMemoryReplSet.create({
			replSet: { name: 'test' },
		});
		const uri = mongoServer.getUri();
		await mongoose.connect(uri, {
			retryWrites: false,
		});
		TestModel = model<TestMongoType>('Test', TestSchema);
	}, 60000); // Increase timeout to 60 seconds

	afterAll(async () => {
		await mongoose.disconnect();
		await mongoServer.stop();
	});

	beforeEach(async () => {
		await TestModel.deleteMany({});
		// biome-ignore lint:useLiteralKeys
		eventBus['eventSubscribers'] = {};
		integrationEventBus.removeAllListeners();
		uow = new MongoUnitOfWork(
			eventBus,
			integrationEventBus,
			TestModel,
			typeConverter,
			repoClass,
		);
	});
	describe('Scenario: Initializing the MongoUnitOfWork', () => {
		describe('Given a valid domain event bus, integration event bus, mongoose model, TypeConverter, and repository class', () => {
			describe('When all dependencies are provided to the MongoUnitOfWork constructor', () => {
				it('Then should initialize the MongoUnitOfWork with all dependencies', () => {
					// Assert
					expect(uow.model).toBe(TestModel);
					expect(uow.typeConverter).toBe(typeConverter);
					expect(uow.bus).toBe(eventBus);
					expect(uow.integrationEventBus).toBe(integrationEventBus);
					expect(uow.repoClass).toBe(repoClass);
					expect(uow.withTransaction).toBeInstanceOf(Function);
				});
			});
		});
	});

	describe('Scenario: Executing a transaction on an aggregate with no side effects', () => {
		describe('Given a valid MongoUnitOfWork and valid props to create a TestAggregate', () => {
			describe('When withTransaction is called to get a new instance of TestAggregate', () => {
				it('Then it should commit the transaction and return the new instance', async () => {
					await uow.withTransaction({}, async (repo) => {
						const aggregate = repo.getNewInstance('bar');
						await repo.save(aggregate);
					});

					const result = await TestModel.findOne({ foo: 'bar' }).exec();
					expect(result).not.toBeNull();
					expect(
						typeConverter.toDomain(result as TestMongoType, {} as unknown),
					).toBeInstanceOf(TestAggregate);
				});
			});
		});
		describe('Given a valid MongoUnitOfWork and an existing TestAggregate', () => {
			const id = new mongoose.Types.ObjectId('60c72b2f9b1e8d3f4c8b4567');
			beforeEach(async () => {
				await TestModel.create({
					_id: id.toString(),
					foo: 'old-foo',
					createdAt: new Date(),
					updatedAt: new Date(),
					schemaVersion: '1.0.0',
				});
			});
			describe('When withTransaction is called to update the foo field', () => {
				it('Then the foo field should be updated in the database after the transaction commits', async () => {
					// Arrange
					expect(await TestModel.findOne({ foo: 'old-foo' })).not.toBeNull();
					// Act
					await uow.withTransaction({}, async (repo) => {
						const aggregate = await repo.get(id.toString());
						aggregate.foo = 'new-foo';
						await repo.save(aggregate);
					});
					// Assert
					const updatedDoc = await TestModel.findById(id).exec();
					const updatedAggregate = typeConverter.toDomain(
						updatedDoc as TestMongoType,
						{} as unknown,
					);
					expect(updatedDoc).not.toBeNull();
					expect(updatedAggregate).toBeInstanceOf(TestAggregate);
					expect(updatedAggregate.foo).toBe('new-foo');
				});
			});
		});
	});

	describe('Scenario: Executing a transaction with domain events', () => {
		describe('Given a valid MongoUnitOfWork and an existing TestAggregate', () => {
			const id = new mongoose.Types.ObjectId('60c72b2f9b1e8d3f4c8b4567');
			beforeEach(async () => {
				await TestModel.create({
					_id: id.toString(),
					foo: 'old-foo',
					bar: 'old-bar',
					baz: 'old-baz',
					createdAt: new Date(),
					updatedAt: new Date(),
					schemaVersion: '1.0.0',
				});
			});

			describe('When withTransaction is called to update the bar field with one domain event registered with one handler', () => {
				it('Then the domain event should be dispatched by eventBus with the correct payload, the handler should succeed, and no integration events should be dispatched', async () => {
					//
					// Arrange

					// Spy on eventBus and integrationEventBus
					const eventBusDispatchSpy = vi.spyOn(eventBus, 'dispatch');
					const integrationEventBusDispatchSpy = vi.spyOn(
						integrationEventBus,
						'dispatch',
					);
					// Register a handler for the TestDomainEvent
					const handler = vi
						.fn()
						.mockImplementation(
							async (payload: { oldBar?: string; bar: string }) => {
								expect(payload).toEqual({ oldBar: 'old-bar', bar: 'new-bar' });
								console.log('Domain event handled:', payload);
								await Promise.resolve();
							},
						);
					eventBus.register(TestBarDomainEvent, handler);

					//
					// Act
					await uow.withTransaction({}, async (repo) => {
						const aggregate = await repo.get(id.toString());
						aggregate.bar = 'new-bar';
						await repo.save(aggregate);
					});

					//
					// Assert
					// The domain event should have been dispatched with the correct payload
					expect(eventBusDispatchSpy).toHaveBeenCalledWith(TestBarDomainEvent, {
						oldBar: 'old-bar',
						bar: 'new-bar',
					});
					// The handler should have been called with the correct payload
					expect(handler).toHaveBeenCalledWith({
						oldBar: 'old-bar',
						bar: 'new-bar',
					});
					// No integration events should have been dispatched
					expect(integrationEventBusDispatchSpy).not.toHaveBeenCalled();
				});
			});

			describe('When withTransaction is called to update the bar field with one domain registered with one async handler', () => {
				it('Then the domain event should be dispatched by eventBus with the correct payload, the unit of work should wait for the handler to complete, and no integration events should be dispatched', async () => {
					// Arrange
					const eventBusDispatchSpy = vi.spyOn(eventBus, 'dispatch');
					const integrationEventBusDispatchSpy = vi.spyOn(
						integrationEventBus,
						'dispatch',
					);
					// Register a handler for the TestDomainEvent
					const handler = vi
						.fn()
						.mockImplementation(
							async (payload: { oldBar?: string; bar: string }) => {
								expect(payload).toEqual({ oldBar: 'old-bar', bar: 'new-bar' });
								console.log('Domain event handled:', payload);
								await new Promise((resolve) => setTimeout(resolve, 10));
							},
						);
					eventBus.register(TestBarDomainEvent, handler);

					await uow.withTransaction({}, async (repo) => {
						const aggregate = await repo.get(id.toString());
						aggregate.bar = 'new-bar';
						await repo.save(aggregate);
					});

					// Assert
					expect(eventBusDispatchSpy).toHaveBeenCalledWith(TestBarDomainEvent, {
						oldBar: 'old-bar',
						bar: 'new-bar',
					});
					expect(handler).toHaveBeenCalledWith({
						oldBar: 'old-bar',
						bar: 'new-bar',
					});
					// No integration events should have been dispatched
					expect(integrationEventBusDispatchSpy).not.toHaveBeenCalled();
				});
			});

			describe('When withTransaction is called to update the bar field with one domain event registered with multiple handlers', () => {
				it('Then the domain event should be dispatched by eventBus with the correct payload, and all handlers should be executed, and no integration events should be dispatched', async () => {
					// Arrange
					// Spy on eventBus and integrationEventBus
					const eventBusDispatchSpy = vi.spyOn(eventBus, 'dispatch');
					const integrationEventBusDispatchSpy = vi.spyOn(
						integrationEventBus,
						'dispatch',
					);
					// Register multiple handlers for the TestDomainEvent
					const handler1 = vi
						.fn()
						.mockImplementation(
							async (payload: { oldBar?: string; bar: string }) => {
								expect(payload).toEqual({ oldBar: 'old-bar', bar: 'new-bar' });
								console.log('TestBarDomainEvent handler1:', payload);
								await Promise.resolve();
							},
						);
					const handler2 = vi
						.fn()
						.mockImplementation(
							async (payload: { oldBar?: string; bar: string }) => {
								expect(payload).toEqual({ oldBar: 'old-bar', bar: 'new-bar' });
								console.log('TestBarDomainEvent handler2:', payload);
								await Promise.resolve();
							},
						);
					eventBus.register(TestBarDomainEvent, handler1);
					eventBus.register(TestBarDomainEvent, handler2);

					//
					// Act
					await uow.withTransaction({}, async (repo) => {
						const aggregate = await repo.get(id.toString());
						aggregate.bar = 'new-bar';
						await repo.save(aggregate);
					});

					//
					// Assert
					// The domain event should have been dispatched with the correct payload
					expect(eventBusDispatchSpy).toHaveBeenCalledWith(TestBarDomainEvent, {
						oldBar: 'old-bar',
						bar: 'new-bar',
					});
					// Both handlers should have been called with the correct payload
					expect(handler1).toHaveBeenCalledWith({
						oldBar: 'old-bar',
						bar: 'new-bar',
					});
					expect(handler2).toHaveBeenCalledWith({
						oldBar: 'old-bar',
						bar: 'new-bar',
					});
					// No integration events should have been dispatched
					expect(integrationEventBusDispatchSpy).not.toHaveBeenCalled();
				});
			});

			describe('When withTransaction is called to update multiple fields, each triggering a different domain event with a handler', () => {
				it('Then both domain events should be dispatched by eventBus with the correct payloads, and both handlers should be executed, and no integration events should be dispatched', async () => {
					//
					// Arrange
					// Spy on eventBus and integrationEventBus
					const eventBusDispatchSpy = vi.spyOn(eventBus, 'dispatch');
					const integrationEventBusDispatchSpy = vi.spyOn(
						integrationEventBus,
						'dispatch',
					);

					// Register handlers for both domain events
					const handler1 = vi
						.fn()
						.mockImplementation(
							async (payload: { oldBar?: string; bar: string }) => {
								expect(payload).toEqual({ oldBar: 'old-bar', bar: 'new-bar' });
								console.log('TestBarDomainEvent handler: ', payload);
								await Promise.resolve();
							},
						);
					const handler2 = vi
						.fn()
						.mockImplementation(
							async (payload: { oldBaz?: string; baz: string }) => {
								expect(payload).toEqual({ oldBaz: 'old-baz', baz: 'new-baz' });
								console.log('TestBazDomainEvent handler: ', payload);
								await Promise.resolve();
							},
						);
					eventBus.register(TestBarDomainEvent, handler1);
					eventBus.register(TestBazDomainEvent, handler2);

					//
					// Act
					await uow.withTransaction({}, async (repo) => {
						const aggregate = await repo.get(id.toString());
						aggregate.bar = 'new-bar';
						aggregate.baz = 'new-baz';
						await repo.save(aggregate);
					});

					//
					// Assert
					// Both domain events should have been dispatched with the correct payloads
					expect(eventBusDispatchSpy).toHaveBeenCalledWith(TestBarDomainEvent, {
						oldBar: 'old-bar',
						bar: 'new-bar',
					});
					expect(eventBusDispatchSpy).toHaveBeenCalledWith(TestBazDomainEvent, {
						oldBaz: 'old-baz',
						baz: 'new-baz',
					});
					// Both handlers should have been called with the correct payloads
					expect(handler1).toHaveBeenCalledWith({
						oldBar: 'old-bar',
						bar: 'new-bar',
					});
					expect(handler2).toHaveBeenCalledWith({
						oldBaz: 'old-baz',
						baz: 'new-baz',
					});
					// No integration events should have been dispatched
					expect(integrationEventBusDispatchSpy).not.toHaveBeenCalled();
				});
			});

			describe('When withTransaction is called to update multiple fields, each triggering a different domain event with multiple handlers', () => {
				it('Then both domain events should be dispatched by eventBus with the correct payloads, and all handlers for each event should be executed, and no integration events should be dispatched', async () => {
					//
					// Arrange
					const eventBusDispatchSpy = vi.spyOn(eventBus, 'dispatch');
					const integrationEventBusDispatchSpy = vi.spyOn(
						integrationEventBus,
						'dispatch',
					);

					// Register multiple handlers for both domain events
					const barHandler1 = vi
						.fn()
						.mockImplementation(
							async (payload: { oldBar?: string; bar: string }) => {
								expect(payload).toEqual({ oldBar: 'old-bar', bar: 'new-bar' });
								console.log('TestBarDomainEvent handler1:', payload);
								await Promise.resolve();
							},
						);
					const barHandler2 = vi
						.fn()
						.mockImplementation(
							async (payload: { oldBar?: string; bar: string }) => {
								expect(payload).toEqual({ oldBar: 'old-bar', bar: 'new-bar' });
								console.log('TestBarDomainEvent handler2:', payload);
								await Promise.resolve();
							},
						);
					const bazHandler1 = vi
						.fn()
						.mockImplementation(
							async (payload: { oldBaz?: string; baz: string }) => {
								expect(payload).toEqual({ oldBaz: 'old-baz', baz: 'new-baz' });
								console.log('TestBazDomainEvent handler1:', payload);
								await Promise.resolve();
							},
						);
					const bazHandler2 = vi
						.fn()
						.mockImplementation(
							async (payload: { oldBaz?: string; baz: string }) => {
								expect(payload).toEqual({ oldBaz: 'old-baz', baz: 'new-baz' });
								console.log('TestBazDomainEvent handler2:', payload);
								await Promise.resolve();
							},
						);
					eventBus.register(TestBarDomainEvent, barHandler1);
					eventBus.register(TestBarDomainEvent, barHandler2);
					eventBus.register(TestBazDomainEvent, bazHandler1);
					eventBus.register(TestBazDomainEvent, bazHandler2);

					//
					// Act
					await uow.withTransaction({}, async (repo) => {
						const aggregate = await repo.get(id.toString());
						aggregate.bar = 'new-bar';
						aggregate.baz = 'new-baz';
						await repo.save(aggregate);
					});

					//
					// Assert
					// Both domain events should have been dispatched with the correct payloads
					expect(eventBusDispatchSpy).toHaveBeenCalledWith(TestBarDomainEvent, {
						oldBar: 'old-bar',
						bar: 'new-bar',
					});
					expect(eventBusDispatchSpy).toHaveBeenCalledWith(TestBazDomainEvent, {
						oldBaz: 'old-baz',
						baz: 'new-baz',
					});
					// All handlers for both events should have been called with the correct payloads
					expect(barHandler1).toHaveBeenCalledWith({
						oldBar: 'old-bar',
						bar: 'new-bar',
					});
					expect(barHandler2).toHaveBeenCalledWith({
						oldBar: 'old-bar',
						bar: 'new-bar',
					});
					expect(bazHandler1).toHaveBeenCalledWith({
						oldBaz: 'old-baz',
						baz: 'new-baz',
					});
					expect(bazHandler2).toHaveBeenCalledWith({
						oldBaz: 'old-baz',
						baz: 'new-baz',
					});
					// No integration events should have been dispatched
					expect(integrationEventBusDispatchSpy).not.toHaveBeenCalled();
				});
			});

			describe('When withTransaction is called to update the bar field and the domain event handler fails', () => {
				it('Then the domain event should be dispatched by eventBus with the correct payload, the handler should throw, and the transaction should abort', async () => {
					//
					// Arrange

					// Spy on eventBus and integrationEventBus
					const eventBusDispatchSpy = vi.spyOn(eventBus, 'dispatch');
					const integrationEventBusDispatchSpy = vi.spyOn(
						integrationEventBus,
						'dispatch',
					);
					// Register a handler for the TestDomainEvent that throws
					const handler = vi
						.fn()
						.mockImplementation(
							async (payload: { oldBar?: string; bar: string }) => {
								expect(payload).toEqual({ oldBar: 'old-bar', bar: 'new-bar' });
								await Promise.resolve();
								throw new Error('Handler failed');
							},
						);
					eventBus.register(TestBarDomainEvent, handler);

					//
					// Act & Assert
					await expect(
						uow.withTransaction({}, async (repo) => {
							const aggregate = await repo.get(id.toString());
							aggregate.bar = 'new-bar';
							await repo.save(aggregate);
						}),
					).rejects.toThrow('Handler failed');

					// The domain event should have been dispatched with the correct payload
					expect(eventBusDispatchSpy).toHaveBeenCalledWith(TestBarDomainEvent, {
						oldBar: 'old-bar',
						bar: 'new-bar',
					});
					// The handler should have been called with the correct payload
					expect(handler).toHaveBeenCalledWith({
						oldBar: 'old-bar',
						bar: 'new-bar',
					});
					// No integration events should have been dispatched
					expect(integrationEventBusDispatchSpy).not.toHaveBeenCalled();

					// The document should not be updated in the database (transaction aborted)
					const doc = await TestModel.findById(id).exec();
					expect(doc?.bar).toBe('old-bar');
				});
			});

			describe('When withTransaction is called to update the bar field and one of multiple domain event handlers fails', () => {
				it('Then the domain event should be dispatched by eventBus with the correct payload, only the first handler should be called, the first error should abort the transaction, and the document should not be updated', async () => {
					//
					// Arrange

					// Spy on eventBus and integrationEventBus
					const eventBusDispatchSpy = vi.spyOn(eventBus, 'dispatch');
					const integrationEventBusDispatchSpy = vi.spyOn(
						integrationEventBus,
						'dispatch',
					);
					// Register multiple handlers for the TestDomainEvent, one of which throws
					const handler1 = vi
						.fn()
						.mockImplementation(
							async (payload: { oldBar?: string; bar: string }) => {
								expect(payload).toEqual({ oldBar: 'old-bar', bar: 'new-bar' });
								await Promise.resolve();
								throw new Error('Handler1 failed');
							},
						);
					const handler2 = vi
						.fn()
						.mockImplementation(
							async (payload: { oldBar?: string; bar: string }) => {
								expect(payload).toEqual({ oldBar: 'old-bar', bar: 'new-bar' });
								await Promise.resolve();
							},
						);
					eventBus.register(TestBarDomainEvent, handler1);
					eventBus.register(TestBarDomainEvent, handler2);

					//
					// Act & Assert
					await expect(
						uow.withTransaction({}, async (repo) => {
							const aggregate = await repo.get(id.toString());
							aggregate.bar = 'new-bar';
							await repo.save(aggregate);
						}),
					).rejects.toThrow('Handler1 failed');

					// The domain event should have been dispatched with the correct payload
					expect(eventBusDispatchSpy).toHaveBeenCalledWith(TestBarDomainEvent, {
						oldBar: 'old-bar',
						bar: 'new-bar',
					});
					// Both handlers should have been called with the correct payload
					expect(handler1).toHaveBeenCalledWith({
						oldBar: 'old-bar',
						bar: 'new-bar',
					});
					expect(handler2).not.toHaveBeenCalled();
					// No integration events should have been dispatched
					expect(integrationEventBusDispatchSpy).not.toHaveBeenCalled();

					// The document should not be updated in the database (transaction aborted)
					const doc = await TestModel.findById(id).exec();
					expect(doc?.bar).toBe('old-bar');
				});
			});

			describe('When withTransaction is called to update the bar field and the first async domain event handler throws after a delay', () => {
				it('Then the domain event should be dispatched by eventBus with the correct payload, only the first handler should be called, the error should abort the transaction, and the document should not be updated', async () => {
					//
					// Arrange

					// Spy on eventBus and integrationEventBus
					const eventBusDispatchSpy = vi.spyOn(eventBus, 'dispatch');
					const integrationEventBusDispatchSpy = vi.spyOn(
						integrationEventBus,
						'dispatch',
					);
					// Register multiple handlers for the TestBarDomainEvent, first of which throws after a delay
					const handler1 = vi
						.fn()
						.mockImplementation(
							async (payload: { oldBar?: string; bar: string }) => {
								expect(payload).toEqual({ oldBar: 'old-bar', bar: 'new-bar' });
								await new Promise((resolve) => setTimeout(resolve, 20));
								throw new Error('Async handler1 failed');
							},
						);
					const handler2 = vi
						.fn()
						.mockImplementation(
							async (_payload: { oldBar?: string; bar: string }) => {
								// This should NOT be called
								await new Promise((resolve) => setTimeout(resolve, 20));
								throw new Error('Handler2 should not be called');
							},
						);
					eventBus.register(TestBarDomainEvent, handler1);
					eventBus.register(TestBarDomainEvent, handler2);

					//
					// Act & Assert
					await expect(
						uow.withTransaction({}, async (repo) => {
							const aggregate = await repo.get(id.toString());
							aggregate.bar = 'new-bar';
							await repo.save(aggregate);
						}),
					).rejects.toThrow('Async handler1 failed');

					// The domain event should have been dispatched with the correct payload
					expect(eventBusDispatchSpy).toHaveBeenCalledWith(TestBarDomainEvent, {
						oldBar: 'old-bar',
						bar: 'new-bar',
					});
					// Only the first handler should have been called
					expect(handler1).toHaveBeenCalledWith({
						oldBar: 'old-bar',
						bar: 'new-bar',
					});
					expect(handler2).not.toHaveBeenCalled();
					// No integration events should have been dispatched
					expect(integrationEventBusDispatchSpy).not.toHaveBeenCalled();

					// The document should not be updated in the database (transaction aborted)
					const doc = await TestModel.findById(id).exec();
					expect(doc?.bar).toBe('old-bar');
				});
			});

			describe('When withTransaction is called to update the bar field with invalid input that causes a value error', () => {
				it('Then the domain event should not be dispatched and the handler should never be called', async () => {
					//
					// Arrange

					// Spy on eventBus and integrationEventBus
					const eventBusDispatchSpy = vi.spyOn(eventBus, 'dispatch');
					const integrationEventBusDispatchSpy = vi.spyOn(
						integrationEventBus,
						'dispatch',
					);
					// Register a handler for the TestBarDomainEvent
					const handler = vi.fn();
					eventBus.register(TestBarDomainEvent, handler);

					//
					// Act & Assert
					await expect(
						uow.withTransaction({}, async (repo) => {
							const aggregate = await repo.get(id.toString());
							// Simulate a value error (e.g., setting bar to an invalid value)
							// For this example, let's say bar cannot be an empty string
							aggregate.bar = ''; // This should throw, and not emit a domain event
							await repo.save(aggregate);
						}),
					).rejects.toThrow();

					// The domain event should NOT have been dispatched
					expect(eventBusDispatchSpy).not.toHaveBeenCalled();
					// The handler should NOT have been called
					expect(handler).not.toHaveBeenCalled();
					// No integration events should have been dispatched
					expect(integrationEventBusDispatchSpy).not.toHaveBeenCalled();

					// The document should not be updated in the database (transaction aborted)
					const doc = await TestModel.findById(id).exec();
					expect(doc?.bar).toBe('old-bar');
				});
			});
		});
	});

	describe('Scenario: Executing a transaction with integration events', () => {
		describe('Given a valid MongoUnitOfWork and an existing TestAggregate', () => {
			const id = new mongoose.Types.ObjectId('60c72b2f9b1e8d3f4c8b4567');

			beforeEach(async () => {
				await TestModel.create({
					_id: id.toString(),
					foo: 'old-foo',
					bar: 'old-bar',
					createdAt: new Date(),
					updatedAt: new Date(),
					schemaVersion: '1.0.0',
				});
			});

			describe('When withTransaction is called and integration event is added during aggregate save', () => {
				it('Then the integration event should be dispatched by integrationEventBus after the transaction commits', async () => {
					// Arrange: spy on integrationEventBus.dispatch
					// Add an integration event during aggregate.save
					// Act: call uow.withTransaction()
					// Assert: integration event dispatched after db commit
				});
			});

			describe('When withTransaction is called but no integration event is registered', () => {
				it('Then no integration events should be dispatched', async () => {
					// Arrange: Spy on integrationEventBus.dispatch
					// Act: update aggregate, don't register integration events
					// Assert: no dispatch calls
				});
			});

			describe('When withTransaction is called and multiple integration events are added', () => {
				it('Then all integration events should be dispatched by integrationEventBus after the transaction commits', async () => {
					// Arrange: add multiple integration events to aggregate
					// Act: save aggregate within transaction
					// Assert: all dispatched after commit
				});
			});

			describe('When withTransaction is called and integration event handler throws', () => {
				it('Then the transaction should still commit and persist data, and the error should not abort the operation', async () => {
					// Arrange: handler throws
					// Act: run transaction
					// Assert: db data is updated, error logged/thrown after commit
				});
			});

			describe('When withTransaction is called and dispatching integration events is delayed', () => {
				it('Then the dispatching should not block transaction completion but should still be awaited', async () => {
					// Arrange: delayed handler (e.g. sleep 100ms)
					// Act: run transaction
					// Assert: no early commit exit
				});
			});

			describe('When withTransaction is called and both domain and integration events are registered', () => {
				it('Then domain events should be dispatched before the transaction commits and integration events after', async () => {
					// Arrange: register domain event + integration event
					// Act: update aggregate and save
					// Assert: domain -> before, integration -> after
				});
			});

			describe('When withTransaction is called and integration event dispatch fails fatally', () => {
				it('Then the transaction should commit, but the failure should be surfaced/logged appropriately', async () => {
					// Arrange: integration bus dispatch throws
					// Act: run transaction
					// Assert: transaction commits, error captured
				});
			});
		});
	});

	// You can now add more integration tests for real transaction scenarios!
});
