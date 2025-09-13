Feature: HandleEvent

  Scenario: Handling a domain event with a registered handler
    Given a domain event handler is registered with a function
    When the handler is called with a domain event
    Then the function should be called with the event

  Scenario: Registering a handler
    Given a function to handle a domain event
    When I register the function using the static register method
    Then I should get a handler that calls the function when handling an event

  Scenario: Registering multiple handlers
    Given multiple handlers for a domain event
    When I register them all using registerAll
    Then all handlers should be called when the event is handled