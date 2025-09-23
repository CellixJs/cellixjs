import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeEventBusInstance } from './node-event-bus.js';
import { DomainSeedwork } from '@cellix/domain-seedwork';

// --- Mocks for OpenTelemetry and performance ---
vi.mock('@opentelemetry/api', () => {
  const propagation = {
    inject: vi.fn(),
    extract: vi.fn(() => ({})),
  };
  const context = {
    active: vi.fn(),
    with: async (_context: unknown, fn: typeof Function) => fn(),
  };
  return {
    default: {
      propagation,
      context,
    },
    trace: {
      getTracer: () => ({
        // biome-ignore lint:noBannedTypes
        startActiveSpan: async (_name: string, fn: Function) =>
          await fn({
            setAttribute: vi.fn(),
            addEvent: vi.fn(),
            setStatus: vi.fn(),
            end: vi.fn(),
            recordException: vi.fn(),
          }),
      }),
    },
    SpanStatusCode: { OK: 1, ERROR: 2, UNSET: 0 },
  };
});
vi.mock('node:perf_hooks', () => ({ performance: { now: () => 0 } }));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/node-event-bus.feature')
);

class TestEvent extends DomainSeedwork.CustomDomainEventImpl<{ test: string }> {}
class EventA extends DomainSeedwork.CustomDomainEventImpl<{ a: string }> {}
class EventB extends DomainSeedwork.CustomDomainEventImpl<{ b: string }> {}

describeFeature(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let handler: ReturnType<typeof vi.fn>;
  let handler1: ReturnType<typeof vi.fn>;
  let handler2: ReturnType<typeof vi.fn>;
  let handlerA: ReturnType<typeof vi.fn>;
  let handlerB: ReturnType<typeof vi.fn>;

  BeforeEachScenario(() => {
    handler = vi.fn().mockResolvedValue(undefined);
    handler1 = vi.fn().mockResolvedValue(undefined);
    handler2 = vi.fn().mockResolvedValue(undefined);
    handlerA = vi.fn().mockResolvedValue(undefined);
    handlerB = vi.fn().mockResolvedValue(undefined);
    NodeEventBusInstance.removeAllListeners();
  });

  Background(({ Given }) => {
    Given('the NodeEventBusInstance singleton', () => {
      // nothing to do, singleton is imported
    });
  });

  Scenario('Initializing the NodeEventBusImpl', ({ When, Then }) => {
    let instance1: typeof NodeEventBusInstance | undefined;
    When('the instance has not been initialized', () => {
      instance1 = NodeEventBusInstance;
    });
    Then('it should initialize the event bus instance and return it', () => {
      expect(instance1).toBeDefined();
      expect(instance1).toBe(NodeEventBusInstance);
      expect(typeof NodeEventBusInstance.dispatch).toBe('function');
      expect(typeof NodeEventBusInstance.register).toBe('function');
      expect(typeof NodeEventBusInstance.removeAllListeners).toBe('function');
    });
  });

  Scenario('Getting the NodeEventBus Instance', ({ When, Then }) => {
    let instance1: typeof NodeEventBusInstance;
    let instance2: typeof NodeEventBusInstance;
    When('the instance has already been initialized', () => {
      instance1 = NodeEventBusInstance;
      instance2 = NodeEventBusInstance;
    });
    Then('it should return the same event bus instance', () => {
      expect(instance1).toBe(instance2);
    });
  });

  Scenario('Registering a handler for an event', ({ Given, When, And, Then }) => {
    Given('an event class and a handler', () => {
      // handler and TestEvent are already defined
    });
    When('the handler is registered', () => {
      NodeEventBusInstance.register(TestEvent, handler);
    });
    And('the event is dispatched', async () => {
      await NodeEventBusInstance.dispatch(TestEvent, { test: 'data' });
    });
    Then('the handler should be called with the correct payload', () => {
      expect(handler).toHaveBeenCalledWith({ test: 'data' });
    });
  });

  Scenario('Registering the same handler multiple times for the same event', ({ Given, When, And, Then }) => {
    Given('an event class and a handler', () => {
      // handler and TestEvent are already defined
    });
    When('the same handler is registered multiple times for the same event', () => {
      NodeEventBusInstance.register(TestEvent, handler);
      NodeEventBusInstance.register(TestEvent, handler);
    });
    And('the event is dispatched', async () => {
      await NodeEventBusInstance.dispatch(TestEvent, { test: 'data' });
    });
    Then('it should be called multiple times with the correct payload', () => {
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenNthCalledWith(1, { test: 'data' });
      expect(handler).toHaveBeenNthCalledWith(2, { test: 'data' });
    });
  });

  Scenario('Registering handlers for different event types', ({ Given, When, And, Then }) => {
    Given('two event classes and two handlers', () => {
      // handlerA, handlerB, EventA, EventB are already defined
    });
    When('each handler is registered for a different event', () => {
      NodeEventBusInstance.register(EventA, handlerA);
      NodeEventBusInstance.register(EventB, handlerB);
    });
    And('each event is dispatched', async () => {
      await NodeEventBusInstance.dispatch(EventA, { a: 'A' });
      await NodeEventBusInstance.dispatch(EventB, { b: 'B' });
    });
    Then('only the correct handler is called for each event', () => {
      expect(handlerA).toHaveBeenCalledWith({ a: 'A' });
      expect(handlerB).toHaveBeenCalledWith({ b: 'B' });
      expect(handlerA).toHaveBeenCalledTimes(1);
      expect(handlerB).toHaveBeenCalledTimes(1);
    });
  });

  Scenario('Handler throws during dispatch', ({ Given, When, Then, And }) => {
    let otel: typeof import('@opentelemetry/api');
    let errorEvent: typeof TestEvent;
    let spanMock: {
      setAttribute: ReturnType<typeof vi.fn>;
      addEvent: ReturnType<typeof vi.fn>;
      setStatus: ReturnType<typeof vi.fn>;
      end: ReturnType<typeof vi.fn>;
      recordException: ReturnType<typeof vi.fn>;
    };

    Given('a registered handler for an event that throws', async () => {
      handler = vi.fn().mockRejectedValue(new Error('handler error'));
      errorEvent = TestEvent;
      NodeEventBusInstance.register(errorEvent, handler);

      // Patch OpenTelemetry span
      otel = await import('@opentelemetry/api');
      spanMock = {
        setAttribute: vi.fn(),
        addEvent: vi.fn(),
        setStatus: vi.fn(),
        end: vi.fn(),
        recordException: vi.fn(),
      };
      vi.spyOn(otel.trace, 'getTracer').mockImplementation((_name?: string, ..._args: unknown[]) => ({
        startActiveSpan: ((_name: string, ...rest: unknown[]) => {
          // Find the function argument (could be 2nd, 3rd, or 4th param)
          // biome-ignore lint:noBannedTypes
          const fn = rest.find(arg => typeof arg === 'function') as Function;
          return fn(spanMock);
        }),
        startSpan: vi.fn(),
      }));
    });
    When('the event is dispatched', async () => {
      await expect(NodeEventBusInstance.dispatch(errorEvent, { test: 'fail' })).resolves.not.toThrow();
    });
    Then('span.setStatus should be called with ERROR', () => {
      expect(spanMock.setStatus).toHaveBeenCalledWith(expect.objectContaining({ code: 2 }));
    });
    And('recordException should be called', () => {
      expect(spanMock.recordException).toHaveBeenCalled();
    });
    And('the span should be ended', () => {
      expect(spanMock.end).toHaveBeenCalled();
    });
    And('the error should NOT be propagated', () => {
      // Already checked by .resolves.not.toThrow()
    });
  });


  Scenario('dispatch catch block is triggered when broadcaster throws synchronously', ({ Given, When, Then, And }) => {
    let otel: typeof import('@opentelemetry/api');
    let spanMock: {
      setAttribute: ReturnType<typeof vi.fn>;
      addEvent: ReturnType<typeof vi.fn>;
      setStatus: ReturnType<typeof vi.fn>;
      end: ReturnType<typeof vi.fn>;
      recordException: ReturnType<typeof vi.fn>;
    };
    let restoreBroadcast: (() => void) | undefined;

    Given('the NodeEventBusInstance singleton', () => {
      // already handled by Background
    });
    And('the broadcaster is patched to throw synchronously', async () => {
      otel = await import('@opentelemetry/api');
      spanMock = {
        setAttribute: vi.fn(),
        addEvent: vi.fn(),
        setStatus: vi.fn(),
        end: vi.fn(),
        recordException: vi.fn(),
      };
      vi.spyOn(otel.trace, 'getTracer').mockImplementation((_name?: string, ..._args: unknown[]) => ({
        startActiveSpan: ((_name: string, ...rest: unknown[]) => {
          // Find the function argument (could be 2nd, 3rd, or 4th param)
          // biome-ignore lint:noBannedTypes
          const fn = rest.find(arg => typeof arg === 'function') as Function;
          return fn(spanMock);
        }),
        startSpan: vi.fn(),
      }));

      // Patch the broadcaster to throw synchronously
      const bus = NodeEventBusInstance as unknown as { broadcaster: { broadcast: (event: string, data: unknown) => void } };
      const originalBroadcast = bus.broadcaster.broadcast;
      const spy = vi.spyOn(bus.broadcaster, 'broadcast').mockImplementation(() => {
        throw new Error('sync broadcast error');
      });
      restoreBroadcast = () => {
        spy.mockRestore();
        bus.broadcaster.broadcast = originalBroadcast;
      };
    });
    When('dispatch is called for an event', async () => {
      await expect(NodeEventBusInstance.dispatch(TestEvent, { test: 'fail' })).resolves.not.toThrow();
    });
    Then('span.setStatus should be called with ERROR', () => {
      expect(spanMock.setStatus).toHaveBeenCalledWith(expect.objectContaining({ code: 2 }));
    });
    And('span.recordException should be called', () => {
      expect(spanMock.recordException).toHaveBeenCalled();
    });
    And('the span should be ended', () => {
      expect(spanMock.end).toHaveBeenCalled();
    });
    And('the broadcaster is restored', () => {
      if (restoreBroadcast) { restoreBroadcast(); }
    });
  });

  Scenario('Multiple handlers for the same event, all called in order', ({ Given, When, And, Then }) => {
    let callOrder: string[];
    Given('multiple handlers for the same event class', () => {
      callOrder = [];
      handler1 = vi.fn(() => callOrder.push('handler1'));
      handler2 = vi.fn(() => callOrder.push('handler2'));
    });
    When('all handlers are registered', () => {
      NodeEventBusInstance.register(TestEvent, handler1);
      NodeEventBusInstance.register(TestEvent, handler2);
    });
    And('the event is dispatched', async () => {
      await NodeEventBusInstance.dispatch(TestEvent, { test: 'data' });
    });
    Then('all handlers should be called in the order they were registered', () => {
      expect(callOrder).toEqual(['handler1', 'handler2']);
    });
  });

  Scenario('Multiple handlers for the same event, one throws, errors not propagated', ({ Given, When, And, Then }) => {
    Given('multiple handlers for the same event class', () => {
      handler1 = vi.fn().mockRejectedValue(new Error('handler1 error'));
      handler2 = vi.fn().mockResolvedValue(undefined);
    });
    When('all handlers are registered and one throws', () => {
      NodeEventBusInstance.register(TestEvent, handler1);
      NodeEventBusInstance.register(TestEvent, handler2);
    });
    And('the event is dispatched', async () => {
      await expect(NodeEventBusInstance.dispatch(TestEvent, { test: 'data' })).resolves.not.toThrow();
    });
    Then('all handlers should be called and errors are not propagated', () => {
      expect(handler1).toHaveBeenCalledWith({ test: 'data' });
      expect(handler2).toHaveBeenCalledWith({ test: 'data' });
    });
  });

  Scenario('Multiple handlers for the same event, all throw, errors not propagated', ({ Given, When, And, Then }) => {
    Given('multiple handlers for the same event class', () => {
      handler1 = vi.fn().mockRejectedValue(new Error('handler1 error'));
      handler2 = vi.fn().mockRejectedValue(new Error('handler2 error'));
    });
    When('all handlers are registered and all throw', () => {
      NodeEventBusInstance.register(TestEvent, handler1);
      NodeEventBusInstance.register(TestEvent, handler2);
    });
    And('the event is dispatched', async () => {
      await expect(NodeEventBusInstance.dispatch(TestEvent, { test: 'data' })).resolves.not.toThrow();
    });
    Then('all handlers should be called and errors are not propagated', () => {
      expect(handler1).toHaveBeenCalledWith({ test: 'data' });
      expect(handler2).toHaveBeenCalledWith({ test: 'data' });
    });
  });

  Scenario('Dispatch does not wait for handler completion', ({ Given, When, And, Then }) => {
    let handlerStarted = false;
    let handlerCompleted = false;
    let asyncHandler: ReturnType<typeof vi.fn>;
    Given('a handler for an event that is asynchronous', () => {
      asyncHandler = vi.fn(async () => {
        handlerStarted = true;
        await new Promise((resolve) => setTimeout(resolve, 50));
        handlerCompleted = true;
      });
    });
    When('the handler is registered', () => {
      NodeEventBusInstance.register(TestEvent, asyncHandler);
    });
    And('the event is dispatched', async () => {
      const dispatchPromise = NodeEventBusInstance.dispatch(TestEvent, { test: 'data' });
      await Promise.resolve(); // allow microtasks to run
      expect(handlerStarted).toBe(true);
      await dispatchPromise;
      expect(handlerCompleted).toBe(false);
      await new Promise((resolve) => setTimeout(resolve, 60));
      expect(handlerCompleted).toBe(true);
    });
    Then('dispatch should resolve before the handler completes', () => {
      // Checked in the And step above
    });
  });

  Scenario('No handlers registered for an event', ({ When, Then }) => {
    When('the event is dispatched', async () => {
      await expect(NodeEventBusInstance.dispatch(TestEvent, { test: 'data' })).resolves.not.toThrow();
    });
    Then('dispatch should do nothing and not throw', () => {
      // Already checked in the When step
    });
  });

  Scenario('Removing all listeners', ({ Given, When, And, Then }) => {
    Given('a registered handler for an event', () => {
      NodeEventBusInstance.register(TestEvent, handler);
    });
    When('removeAllListeners is called', () => {
      NodeEventBusInstance.removeAllListeners();
    });
    And('the event is dispatched', async () => {
      await NodeEventBusInstance.dispatch(TestEvent, { test: 'data' });
    });
    Then('all handlers should be removed and not called', () => {
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
