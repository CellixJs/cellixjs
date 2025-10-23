import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature} from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { DomainEventBase } from './domain-event.ts';
import { HandleEventImpl } from './handle-event.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/handle-event.feature')
);

class TestEvent extends DomainEventBase {}

test.for(feature, ({ Scenario }) => {
  let handlerFn: ReturnType<typeof vi.fn>;
  let handler: HandleEventImpl<TestEvent>;
  let event: TestEvent;

  Scenario('Handling a domain event with a registered handler', ({ Given, When, Then }) => {
    Given('a domain event handler is registered with a function', () => {
      handlerFn = vi.fn();
      handler = new HandleEventImpl<TestEvent>(handlerFn);
      event = new TestEvent('agg-1');
    });
    When('the handler is called with a domain event', () => {
      handler.handle(event);
    });
    Then('the function should be called with the event', () => {
      expect(handlerFn).toHaveBeenCalledTimes(1);
      expect(handlerFn).toHaveBeenCalledWith(event);
    });
  });

  Scenario('Registering a handler', ({ Given, When, Then }) => {
    Given('a function to handle a domain event', () => {
      handlerFn = vi.fn();
      event = new TestEvent('agg-2');
    });
    When('I register the function using the static register method', () => {
      handler = HandleEventImpl.register<TestEvent>(handlerFn) as HandleEventImpl<TestEvent>;
    });
    Then('I should get a handler that calls the function when handling an event', () => {
      handler.handle(event);
      expect(handlerFn).toHaveBeenCalledTimes(1);
      expect(handlerFn).toHaveBeenCalledWith(event);
    });
  });

  Scenario('Registering multiple handlers', ({ Given, When, Then }) => {
    let handlerFn1: ReturnType<typeof vi.fn>;
    let handlerFn2: ReturnType<typeof vi.fn>;
    let handler1: HandleEventImpl<TestEvent>;
    let handler2: HandleEventImpl<TestEvent>;
    let combinedHandler: HandleEventImpl<TestEvent>;

    Given('multiple handlers for a domain event', () => {
      handlerFn1 = vi.fn();
      handlerFn2 = vi.fn();
      handler1 = new HandleEventImpl<TestEvent>(handlerFn1);
      handler2 = new HandleEventImpl<TestEvent>(handlerFn2);
      event = new TestEvent('agg-3');
    });
    When('I register them all using registerAll', () => {
      combinedHandler = handler1.registerAll([handler1, handler2]) as HandleEventImpl<TestEvent>;
    });
    Then('all handlers should be called when the event is handled', () => {
      combinedHandler.handle(event);
      expect(handlerFn1).toHaveBeenCalledTimes(1);
      expect(handlerFn1).toHaveBeenCalledWith(event);
      expect(handlerFn2).toHaveBeenCalledTimes(1);
      expect(handlerFn2).toHaveBeenCalledWith(event);
    });
  });
});