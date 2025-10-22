import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature  } from '@amiceli/vitest-cucumber';
import { expect, type MockedObject, vi } from 'vitest';
import { CustomDomainEventImpl } from './domain-event.ts';
import type { EventBus } from './event-bus.ts';
import { EventPublisher } from './publish-event.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/publish-event.feature')
);

class TestDomainEvent extends CustomDomainEventImpl<{ foo: string }> {}

test.for(feature, ({ Scenario }) => {
  let eventBus: MockedObject<EventBus>;
  let publisher: EventPublisher;
  let eventClass: new (aggregateId: string) => TestDomainEvent;
  let payload: { foo: string };
  let publishResult: unknown;

  Scenario('Publishing an event calls the event bus dispatch method', ({ Given, And, When, Then }) => {
    Given('an event publisher with a mock event bus', () => {
      eventBus = { 
        dispatch: vi.fn().mockResolvedValue(undefined),
        register: vi.fn(),
     };
      publisher = new EventPublisher(eventBus);
    });
    And('a domain event class and payload', () => {
      eventClass = TestDomainEvent;
      payload = { foo: 'bar' };
    });
    When('I publish the event using the event publisher', async () => {
      await publisher.publish(eventClass, payload);
    });
    Then('the event bus dispatch method should be called with the event class and payload', () => {
      expect(eventBus.dispatch).toHaveBeenCalledTimes(1);
      expect(eventBus.dispatch).toHaveBeenCalledWith(eventClass, payload);
    });
  });

  Scenario('Event Publisher returns a resolved promise after publishing', ({ Given, And, When, Then }) => {
    Given('an event publisher with a mock event bus', () => {
      eventBus = { 
        dispatch: vi.fn().mockResolvedValue(undefined),
        register: vi.fn(),
     };
      publisher = new EventPublisher(eventBus);
    });
    And('a domain event class and payload', () => {
      eventClass = TestDomainEvent;
      payload = { foo: 'baz' };
    });
    When('I publish the event using the event publisher', async () => {
      publishResult = await publisher.publish(eventClass, payload);
    });
    Then('the publish method should return a resolved promise', () => {
      expect(publishResult).toBeUndefined();
      expect(eventBus.dispatch).toHaveBeenCalledWith(eventClass, payload);
    });
  });
});
