import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { SyncDomainEventImpl } from './sync-domain-event-bus.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/sync-domain-event-bus.feature'));

interface TestPayload {
  foo: string;
}

class TestSyncDomainEvent extends SyncDomainEventImpl<TestPayload> {}

test.for(feature, ({ Scenario }) => {
  let event: TestSyncDomainEvent;
  let error: Error | undefined;

  Scenario('Constructing a Sync Domain Event Bus', ({ Given, When, Then }) => {
    Given('a new sync domain event', () => {
      event = new TestSyncDomainEvent();
    });
    When('I set the payload to a value', () => {
      event.payload = { foo: 'bar' };
    });
    Then('getting the payload should return that value', () => {
      expect(event.payload).toEqual({ foo: 'bar' });
    });
  });

  Scenario('Accessing the payload before it is set', ({ Given, When, Then }) => {
    Given('a new sync domain event', () => {
      event = new TestSyncDomainEvent();
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
  });
});
