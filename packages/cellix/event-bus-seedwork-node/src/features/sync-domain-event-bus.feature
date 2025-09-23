Feature: SyncDomainEventBus

  Scenario: Constructing a Sync Domain Event Bus
    Given a new sync domain event
    When I set the payload to a value
    Then getting the payload should return that value

  Scenario: Accessing the payload before it is set
    Given a new sync domain event
    When I try to get the payload before setting it
    Then it should throw an error indicating the payload is not set