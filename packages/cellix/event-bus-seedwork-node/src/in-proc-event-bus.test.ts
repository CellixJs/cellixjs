import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { DomainSeedwork } from '@cellix/domain-seedwork';
import { expect, vi } from 'vitest';
import { InProcEventBusInstance } from './in-proc-event-bus.ts';



const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/in-proc-event-bus.feature')
);

class TestEvent extends DomainSeedwork.CustomDomainEventImpl<{ test: string }> {}
class TestEventA extends DomainSeedwork.CustomDomainEventImpl<{ testA: string }> {}
class TestEventB extends DomainSeedwork.CustomDomainEventImpl<{ testB: string }> {}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let handler: ReturnType<typeof vi.fn>;
  let handler1: ReturnType<typeof vi.fn>;
  let handler2: ReturnType<typeof vi.fn>;
  let handlerA: ReturnType<typeof vi.fn>;
  let handlerB: ReturnType<typeof vi.fn>;
  let error: unknown;

  // Reset the singleton's subscribers for isolation before each scenario
  BeforeEachScenario(() => {
    (InProcEventBusInstance as unknown as { eventSubscribers: Record<string, Array<(rawpayload: string) => Promise<void>> | undefined> }).eventSubscribers = {};
    handler = vi.fn().mockResolvedValue(undefined);
    handler1 = vi.fn().mockResolvedValue(undefined);
    handler2 = vi.fn().mockResolvedValue(undefined);
    handlerA = vi.fn().mockResolvedValue(undefined);
    handlerB = vi.fn().mockResolvedValue(undefined);
    error = undefined;
  });

  Scenario('Initializing the InProcEventBus', ({ Given, When, Then }) => {
    let instance1: typeof InProcEventBusInstance | undefined;
    Given('the InProcEventBusInstance singleton', () => {
      // nothing to do, singleton is imported
    });
    When('the instance has not been initialized', () => {
      instance1 = InProcEventBusInstance;
    });
    Then('it should initialize the instance and return it', () => {
      expect(instance1).toBeDefined();
      expect(instance1).toBe(InProcEventBusInstance);
      expect(typeof InProcEventBusInstance.dispatch).toBe('function');
      expect(typeof InProcEventBusInstance.register).toBe('function');
    });
  });

  Scenario('Getting the InProcEventBus Instance', ({ Given, When, Then }) => {
    let instance1: typeof InProcEventBusInstance;
    let instance2: typeof InProcEventBusInstance;
    Given('the InProcEventBusInstance singleton', () => {
      // nothing to do, singleton is imported
    });
    When('the instance has already been initialized', () => {
      instance1 = InProcEventBusInstance;
      instance2 = InProcEventBusInstance;
    });
    Then('it should return the same instance', () => {
      expect(instance1).toBe(instance2);
    });
  });

  Scenario('Registering and dispatching a handler for an event', ({ Given, When, And, Then }) => {
    Given('an event class and a handler', () => {
      // handler and TestEvent are already defined
    });
    When('the handler is registered', () => {
      InProcEventBusInstance.register(TestEvent, handler);
    });
    And('the event is dispatched', async () => {
      await InProcEventBusInstance.dispatch(TestEvent, { test: 'data' });
    });
    Then('the handler should be called with the event payload', () => {
      expect(handler).toHaveBeenCalledWith({ test: 'data' });
    });
  });

  Scenario('Registering and dispatching multiple handlers for the same event', ({ Given, When, And, Then }) => {
    Given('multiple handlers for the same event class', () => {
      // handler1 and handler2 are already defined
    });
    When('both handlers are registered', () => {
      InProcEventBusInstance.register(TestEvent, handler1);
      InProcEventBusInstance.register(TestEvent, handler2);
    });
    And('the event is dispatched', async () => {
      await InProcEventBusInstance.dispatch(TestEvent, { test: 'data' });
    });
    Then('both handlers should be called with the event payload', () => {
      expect(handler1).toHaveBeenCalledWith({ test: 'data' });
      expect(handler2).toHaveBeenCalledWith({ test: 'data' });
    });
  });

  Scenario('Handler throws and both are registered', ({ Given, When, And, Then }) => {
    Given('multiple handlers for the same event class', () => {
      handler1 = vi.fn().mockRejectedValue(new Error('handler1 error'));
      handler2 = vi.fn().mockResolvedValue(undefined);
    });
    When('one handler throws and both are registered', () => {
      InProcEventBusInstance.register(TestEvent, handler1);
      InProcEventBusInstance.register(TestEvent, handler2);
    });
    And('the event is dispatched', async () => {
      try {
        await InProcEventBusInstance.dispatch(TestEvent, { test: 'data' });
      } catch (e) {
        error = e;
      }
    });
    Then('the other handler after the throwing one should NOT be called', () => {
      expect(handler1).toHaveBeenCalledWith({ test: 'data' });
      expect(handler2).not.toHaveBeenCalled();
    });
    And('the error should be propagated', () => {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('handler1 error');
    });
  });

  Scenario('Registering handlers for different event classes', ({ Given, When, And, Then }) => {
    Given('handlers for different event classes', () => {
      // handlerA, handlerB, TestEventA, TestEventB are already defined
    });
    When('both handlers are registered for different events', () => {
      InProcEventBusInstance.register(TestEventA, handlerA);
      InProcEventBusInstance.register(TestEventB, handlerB);
    });
    And('each event is dispatched', async () => {
      await InProcEventBusInstance.dispatch(TestEventA, { testA: 'dataA' });
      await InProcEventBusInstance.dispatch(TestEventB, { testB: 'dataB' });
    });
    Then('only the correct handler should be called for each event', () => {
      expect(handlerA).toHaveBeenCalledWith({ testA: 'dataA' });
      expect(handlerB).toHaveBeenCalledWith({ testB: 'dataB' });
      expect(handlerA).toHaveBeenCalledTimes(1);
      expect(handlerB).toHaveBeenCalledTimes(1);
    });
  });
});