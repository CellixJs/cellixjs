Feature: DomainEvent

  Scenario: Constructing a Domain Event
    Given an aggregate id
    When a domain event is constructed with the aggregate id
    Then it should return the correct aggregate id

  Scenario: Setting a payload on a Domain Event
    Given a new domain event
    When I set the payload to a value
    Then getting the payload should return that value

  Scenario: Accessing a payload on a Domain Event before it is set
    Given a new domain event
    When I try to get the payload before setting it
    Then it should throw an error indicating the payload is not set
