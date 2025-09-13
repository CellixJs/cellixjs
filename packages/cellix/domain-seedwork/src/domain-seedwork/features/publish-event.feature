Feature: PublishEvent

  Scenario: Publishing an event calls the event bus dispatch method
    Given an event publisher with a mock event bus
    And a domain event class and payload
    When I publish the event using the event publisher
    Then the event bus dispatch method should be called with the event class and payload

  Scenario: Event Publisher returns a resolved promise after publishing
    Given an event publisher with a mock event bus
    And a domain event class and payload
    When I publish the event using the event publisher
    Then the publish method should return a resolved promise