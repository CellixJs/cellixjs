import { expect, vi } from 'vitest';
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { AggregateRoot } from './aggregate-root.ts';
import { DomainSeedwork } from '../index.ts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';


const test = { for: describeFeature };
class TestDomainEvent extends DomainSeedwork.CustomDomainEventImpl<TestAggregateCreatedProps> {}

interface TestAggregateUpdatedProps {
	testAggregateId: string;
	foo: string;
}

class TestAggregateUpdatedEvent extends DomainSeedwork.CustomDomainEventImpl<TestAggregateUpdatedProps> {}

interface TestAggregateCreatedProps {
	foo: string;
}
class TestAggregateCreatedEvent extends DomainSeedwork.CustomDomainEventImpl<TestAggregateCreatedProps> {}

interface TestAggregateDeletedProps {
	testAggregateId: string;
}
class TestAggregateDeletedEvent extends DomainSeedwork.CustomDomainEventImpl<TestAggregateDeletedProps> {}

interface TestAggregateProps extends DomainSeedwork.DomainEntityProps {
	foo: string;
	bar?: string | undefined;
}

interface TestAggregateEntityReference extends Readonly<TestAggregateProps> {}

class TestAggregate<props extends TestAggregateProps>
	extends AggregateRoot<props, unknown>
	implements TestAggregateEntityReference
{
	get foo(): string {
		return this.props.foo;
	}

	public override onSave(isModified: boolean): void {
		if (isModified) {
			this.addIntegrationEvent(TestAggregateUpdatedEvent, {
				testAggregateId: this.props.id,
				foo: this.props.foo,
			});
		}
	}

	public requestDelete(): void {
		super.isDeleted = true;
		this.addIntegrationEvent(TestAggregateDeletedEvent, {
			testAggregateId: this.props.id,
		});
	}
}

function findEvent<T>(
	events: readonly unknown[],
	eventClass: new (aggregateId: string) => T,
): T | undefined {
	return events.find((e) => e instanceof eventClass) as T | undefined;
}

function expectEventEmitted<T>(
	events: readonly unknown[],
	eventClass: new (aggregateId: string) => T,
	payloadMatcher?: (event: T) => void,
) {
	const event = findEvent(events, eventClass);
	expect(event).toBeDefined();
	expect(event).toBeInstanceOf(eventClass);
	if (payloadMatcher) {
		payloadMatcher(event as T);
	}
}

function expectNoEventEmitted<T>(
	events: readonly unknown[],
	eventClass: new (aggregateId: string) => T,
) {
	const event = findEvent(events, eventClass);
	expect(event).toBeUndefined();
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const aggregateRootFeature = await loadFeature(path.resolve(__dirname, 'features/aggregate-root.feature'));

test.for(aggregateRootFeature, ({ Scenario, Background, BeforeEachScenario}) => {
	let aggregate: TestAggregate<TestAggregateProps>;
	let baseProps: TestAggregateProps;
	let mockedPassport: unknown;

	BeforeEachScenario(() => {
		baseProps = { id: 'agg-1', foo: 'bar' };
		mockedPassport = vi.mocked({} as unknown);
	});

	Background(({ Given }) => {
		Given('an aggregate root instance', () => {
			aggregate = new TestAggregate(baseProps, mockedPassport);
		});
	});

	Scenario('Constructing an Aggregate Root', ({ Given, When, Then }) => {
		Given('a set of initial properties and some type of passport', () => {
			baseProps = { id: 'agg-1', foo: 'bar' };
			mockedPassport = vi.mocked({} as unknown);
		});
		When('the aggregate root is constructed', () => {
			aggregate = new TestAggregate(baseProps, mockedPassport);
		});
		Then('it should initialize the properties correctly', () => {
			expect(aggregate.id).toBe(baseProps.id);
			expect(aggregate.foo).toBe(baseProps.foo);
		});
	});

	Scenario('Managing Domain Events - add one', ({ When, Then}) => {
		When('a domain event is added', () => {
			aggregate.addDomainEvent(TestDomainEvent, { foo: aggregate.foo });
		});
		Then('it should add a domain event to the aggregate domain events and not have any integration events', () => {
			expectEventEmitted(
				aggregate.getDomainEvents(),
				TestDomainEvent,
				(event) => {
					expect(event.payload).toEqual({ foo: baseProps.foo });
				},
			);
			expect(aggregate.getIntegrationEvents()).toHaveLength(0);
		});
	});

	Scenario('Managing Domain Events - add multiple', ({ When, Then, And }) => {
		When('multiple domain events are added', () => {
			aggregate.addDomainEvent(TestDomainEvent, { foo: 'bar' });
			aggregate.addDomainEvent(TestDomainEvent, { foo: 'baz' });
		});
		Then('it should have multiple domain events on the aggregate and not have any integration events', () => {
			expect(aggregate.getDomainEvents()).toHaveLength(2);
			for (const event of aggregate.getDomainEvents()) {
				expect(event).toBeInstanceOf(TestDomainEvent);
			}
			expect(aggregate.getIntegrationEvents()).toHaveLength(0);
		});
		And('it should maintain order of domain events', () => {
			aggregate.clearDomainEvents();
			aggregate.addDomainEvent(TestDomainEvent, { foo: 'first' });
			aggregate.addDomainEvent(TestDomainEvent, { foo: 'second' });
			aggregate.addDomainEvent(TestDomainEvent, { foo: 'third' });
			const events = aggregate
				.getDomainEvents()
				.map((e) => (e instanceof TestDomainEvent ? e : null));
			expect(events[0]?.payload).toEqual({ foo: 'first' });
			expect(events[1]?.payload).toEqual({ foo: 'second' });
			expect(events[2]?.payload).toEqual({ foo: 'third' });
		});
	});

	Scenario('Managing Domain Events - clear after add', ({ When, Then }) => {
		When('domain events are added and then cleared', () => {
			aggregate.addDomainEvent(TestDomainEvent, { foo: 'bar' });
			aggregate.addDomainEvent(TestDomainEvent, { foo: 'baz' });
			aggregate.clearDomainEvents();
		});
		Then('it should clear all domain events from the aggregate', () => {
			expectNoEventEmitted(aggregate.getDomainEvents(), TestDomainEvent);
		});
	});

	Scenario('Managing Domain Events - clear with none', ({ When, Then }) => {
		When('no domain events are added but domain events are cleared', () => {
			aggregate.clearDomainEvents();
		});
		Then('it should not emit any domain events', () => {
			expect(aggregate.getDomainEvents()).toHaveLength(0);
		});
	});

	Scenario('Managing Domain Events - clear domain only', ({ When, Then }) => {
		When('domain events and integration events exist and domain events are cleared', () => {
			aggregate.addDomainEvent(TestDomainEvent, { foo: 'bar' });
			aggregate.addDomainEvent(TestDomainEvent, { foo: 'baz' });
			aggregate.addIntegrationEvent(TestAggregateCreatedEvent, {
				foo: 'bar',
			});
			aggregate.addIntegrationEvent(TestAggregateUpdatedEvent, {
				testAggregateId: 'agg-1',
				foo: 'baz',
			});
			aggregate.clearDomainEvents();
		});
		Then('it should clear all domain events from the aggregate but not integration events', () => {
			expectNoEventEmitted(aggregate.getDomainEvents(), TestDomainEvent);
			expect(aggregate.getIntegrationEvents()).toHaveLength(2);
		});
	});

	Scenario('Managing Domain Events - clear all', ({ When, Then }) => {
		When('domain events and integration events exist and both domain events and integration events are cleared', () => {
			aggregate.addDomainEvent(TestDomainEvent, { foo: 'bar' });
			aggregate.addDomainEvent(TestDomainEvent, { foo: 'baz' });
			aggregate.addIntegrationEvent(TestAggregateCreatedEvent, {
				foo: 'bar',
			});
			aggregate.addIntegrationEvent(TestAggregateUpdatedEvent, {
				testAggregateId: 'agg-1',
				foo: 'baz',
			});
			aggregate.clearDomainEvents();
			aggregate.clearIntegrationEvents();
		});
		Then('it should clear all domain events and all integration events from the aggregate', () => {
			expect(aggregate.getDomainEvents()).toHaveLength(0);
			expect(aggregate.getIntegrationEvents()).toHaveLength(0);
			expectNoEventEmitted(aggregate.getDomainEvents(), TestDomainEvent);
			expectNoEventEmitted(
				aggregate.getIntegrationEvents(),
				TestAggregateCreatedEvent,
			);
			expectNoEventEmitted(
				aggregate.getIntegrationEvents(),
				TestAggregateUpdatedEvent,
			);
		});
	});

	Scenario('Managing Integration Events - add one', ({ When, Then }) => {
		When('an integration event is added', () => {
			aggregate.addIntegrationEvent(TestAggregateUpdatedEvent, {
				testAggregateId: 'agg-1',
				foo: 'baz',
			});
		});
		Then('it should add an integration event to the aggregate integration events and not have any domain events', () => {
			expectEventEmitted(
				aggregate.getIntegrationEvents(),
				TestAggregateUpdatedEvent,
				(event) => {
					expect(event.payload).toEqual({
						testAggregateId: 'agg-1',
						foo: 'baz',
					});
				},
			);
			expect(aggregate.getDomainEvents()).toHaveLength(0);
		});
	});

	Scenario('Managing Integration Events - add multiple', ({ When, Then, And }) => {
		When('multiple integration events are added', () => {
			aggregate.addIntegrationEvent(TestAggregateUpdatedEvent, {
				testAggregateId: 'agg-1',
				foo: 'bar',
			});
			aggregate.addIntegrationEvent(TestAggregateUpdatedEvent, {
				testAggregateId: 'agg-1',
				foo: 'baz',
			});
		});
		Then('it should have multiple integration events on the aggregate and not have any domain events', () => {
			expect(aggregate.getIntegrationEvents()).toHaveLength(2);
			for (const event of aggregate.getIntegrationEvents()) {
				expect(event).toBeInstanceOf(TestAggregateUpdatedEvent);
			}
			expect(aggregate.getDomainEvents()).toHaveLength(0);
		});
		And('it should maintain order of integration events', () => {
			aggregate.clearIntegrationEvents();
			aggregate.addIntegrationEvent(TestAggregateUpdatedEvent, {
				testAggregateId: 'agg-1',
				foo: 'first',
			});
			aggregate.addIntegrationEvent(TestAggregateUpdatedEvent, {
				testAggregateId: 'agg-1',
				foo: 'second',
			});
			aggregate.addIntegrationEvent(TestAggregateUpdatedEvent, {
				testAggregateId: 'agg-1',
				foo: 'third',
			});
			const events = aggregate
				.getIntegrationEvents()
				.map((e) => (e instanceof TestAggregateUpdatedEvent ? e : null));
			expect(events[0]?.payload).toEqual({
				testAggregateId: 'agg-1',
				foo: 'first',
			});
			expect(events[1]?.payload).toEqual({
				testAggregateId: 'agg-1',
				foo: 'second',
			});
			expect(events[2]?.payload).toEqual({
				testAggregateId: 'agg-1',
				foo: 'third',
			});
		});
	});

	Scenario('Managing Integration Events - clear', ({ When, Then }) => {
		When('integration events are cleared', () => {
			aggregate.addIntegrationEvent(TestAggregateUpdatedEvent, {
				testAggregateId: 'agg-1',
				foo: 'bar',
			});
			aggregate.addIntegrationEvent(TestAggregateUpdatedEvent, {
				testAggregateId: 'agg-1',
				foo: 'baz',
			});
			aggregate.clearIntegrationEvents();
		});
		Then('it should clear all integration events from the aggregate', () => {
			expectNoEventEmitted(
				aggregate.getIntegrationEvents(),
				TestAggregateUpdatedEvent,
			);
		});
	});

	Scenario('Managing Integration Events - clear integration only', ({ When, Then }) => {
		When('integration events and domain events exist and integration events are cleared', () => {
			aggregate.addIntegrationEvent(TestAggregateUpdatedEvent, {
				testAggregateId: 'agg-1',
				foo: 'bar',
			});
			aggregate.addIntegrationEvent(TestAggregateUpdatedEvent, {
				testAggregateId: 'agg-1',
				foo: 'baz',
			});
			aggregate.addDomainEvent(TestDomainEvent, { foo: 'bar' });
			aggregate.addDomainEvent(TestDomainEvent, { foo: 'baz' });
			aggregate.clearIntegrationEvents();
		});
		Then('it should clear all integration events from the aggregate but not domain events', () => {
			expectNoEventEmitted(
				aggregate.getIntegrationEvents(),
				TestAggregateUpdatedEvent,
			);
			expect(aggregate.getDomainEvents()).toHaveLength(2);
		});
	});

	Scenario('Saving an Aggregate Root (modified)', ({ When, Then, And }) => {
		let spy: ReturnType<typeof vi.spyOn>;
		When('the onSave method is called with true', () => {
			spy = vi.spyOn(aggregate, 'addIntegrationEvent');
			aggregate.onSave(true);
		});
		Then('it should not throw an error', () => {
			expect(true).toBe(true);
		});
		And('it should emit the onSave event', () => {
			expect(spy).toHaveBeenCalledWith(TestAggregateUpdatedEvent, {
				testAggregateId: aggregate.id,
				foo: aggregate.foo,
			});
		});
	});

	Scenario('Saving an Aggregate Root (not modified)', ({ When, Then, And }) => {
		let spy: ReturnType<typeof vi.spyOn>;
		When('the onSave method is called with false', () => {
			spy = vi.spyOn(aggregate, 'addIntegrationEvent');
			aggregate.onSave(false);
		});
		Then('it should not throw an error', () => {
			expect(true).toBe(true);
		});
		And('it should not emit the onSave event', () => {
			expect(spy).not.toHaveBeenCalled();
		});
	});

	Scenario('Deleting an Aggregate Root (not deleted)', ({ When, Then }) => {
		When('the aggregate root has not requested deletion', () => {
			// do nothing, just check state
		});
		Then('the isDeleted property should be false', () => {
			expect(aggregate.isDeleted).toBe(false);
		});
	});

	Scenario('Deleting an Aggregate Root (deleted)', ({ When, Then }) => {
		When('the aggregate root requests to be deleted', () => {
			aggregate.requestDelete();
		});
		Then('the isDeleted property should be set to true', () => {
			expect(aggregate.isDeleted).toBe(true);
		});
	});


});
