Feature: InProcEventBus

  Scenario: Initializing the InProcEventBus
    Given the InProcEventBusInstance singleton
    When the instance has not been initialized
    Then it should initialize the instance and return it

  Scenario: Getting the InProcEventBus Instance
    Given the InProcEventBusInstance singleton
    When the instance has already been initialized
    Then it should return the same instance

  Scenario: Registering and dispatching a handler for an event
    Given an event class and a handler
    When the handler is registered
    And the event is dispatched
    Then the handler should be called with the event payload

  Scenario: Registering and dispatching multiple handlers for the same event
    Given multiple handlers for the same event class
    When both handlers are registered
    And the event is dispatched
    Then both handlers should be called with the event payload

  Scenario: Handler throws and both are registered
    Given multiple handlers for the same event class
    When one handler throws and both are registered
    And the event is dispatched
    Then the other handler after the throwing one should NOT be called
    And the error should be propagated

  Scenario: Registering handlers for different event classes
    Given handlers for different event classes
    When both handlers are registered for different events
    And each event is dispatched
    Then only the correct handler should be called for each event
>>>>>>> REPLACE
