import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { CustomDomainEventImpl } from './domain-event.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/domain-event.feature'),
);

class TestDomainEvent extends CustomDomainEventImpl<{ foo: string }> {}

test.for(feature, ({ Scenario }) => {
	let aggregateId: string;
	let event: TestDomainEvent;
	let error: Error | undefined;

	Scenario('Constructing a Domain Event', ({ Given, When, Then }) => {
		Given('an aggregate id', () => {
			aggregateId = 'agg-123';
		});
		When('a domain event is constructed with the aggregate id', () => {
			event = new TestDomainEvent(aggregateId);
		});
		Then('it should return the correct aggregate id', () => {
			expect(event.aggregateId).toBe(aggregateId);
		});
	});

	Scenario('Setting a payload on a Domain Event', ({ Given, When, Then }) => {
		Given('a new domain event', () => {
			event = new TestDomainEvent('agg-456');
		});
		When('I set the payload to a value', () => {
			event.payload = { foo: 'bar' };
		});
		Then('getting the payload should return that value', () => {
			expect(event.payload).toEqual({ foo: 'bar' });
		});
	});

	Scenario(
		'Accessing a payload on a Domain Event before it is set',
		({ Given, When, Then }) => {
			Given('a new domain event', () => {
				event = new TestDomainEvent('agg-789');
			});
			When('I try to get the payload before setting it', () => {
				try {
					console.log(event.payload);
				} catch (e) {
					error = e as Error;
				}
			});
			Then('it should throw an error indicating the payload is not set', () => {
				expect(error).toBeInstanceOf(Error);
				expect(error?.message).toMatch(/payload is not set/i);
			});
		},
	);
});
