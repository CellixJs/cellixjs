Feature: NodeEventBus

  Background:
    Given the NodeEventBusInstance singleton

  Scenario: Initializing the NodeEventBusImpl
    When the instance has not been initialized
    Then it should initialize the event bus instance and return it

  Scenario: Getting the NodeEventBus Instance
    When the instance has already been initialized
    Then it should return the same event bus instance

  Scenario: Registering a handler for an event
    Given an event class and a handler
    When the handler is registered
    And the event is dispatched
    Then the handler should be called with the correct payload

  Scenario: Registering the same handler multiple times for the same event
    Given an event class and a handler
    When the same handler is registered multiple times for the same event
    And the event is dispatched
    Then it should be called multiple times with the correct payload

  Scenario: Registering handlers for different event types
    Given two event classes and two handlers
    When each handler is registered for a different event
    And each event is dispatched
    Then only the correct handler is called for each event

  Scenario: Handler throws during dispatch
    Given a registered handler for an event that throws
    When the event is dispatched
    Then span.setStatus should be called with ERROR
    And recordException should be called
    And the span should be ended
    And the error should NOT be propagated

  Scenario: dispatch catch block is triggered when broadcaster throws synchronously
    Given the NodeEventBusInstance singleton
    And the broadcaster is patched to throw synchronously
    When dispatch is called for an event
    Then span.setStatus should be called with ERROR
    And span.recordException should be called
    And the span should be ended
    And the broadcaster is restored

  Scenario: Multiple handlers for the same event, all called in order
    Given multiple handlers for the same event class
    When all handlers are registered
    And the event is dispatched
    Then all handlers should be called in the order they were registered

  Scenario: Multiple handlers for the same event, one throws, errors not propagated
    Given multiple handlers for the same event class
    When all handlers are registered and one throws
    And the event is dispatched
    Then all handlers should be called and errors are not propagated

  Scenario: Multiple handlers for the same event, all throw, errors not propagated
    Given multiple handlers for the same event class
    When all handlers are registered and all throw
    And the event is dispatched
    Then all handlers should be called and errors are not propagated

  Scenario: Dispatch does not wait for handler completion
    Given a handler for an event that is asynchronous
    When the handler is registered
    And the event is dispatched
    Then dispatch should resolve before the handler completes

  Scenario: No handlers registered for an event
    When the event is dispatched
    Then dispatch should do nothing and not throw

  Scenario: Removing all listeners
    Given a registered handler for an event
    When removeAllListeners is called
    And the event is dispatched
    Then all handlers should be removed and not called
