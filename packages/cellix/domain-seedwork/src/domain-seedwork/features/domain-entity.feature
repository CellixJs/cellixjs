Feature: DomainEntity

  Scenario: Constructing a Domain Entity
    Given a set of initial properties
    When the domain entity is constructed
    Then it should initialize the properties correctly

  Scenario: Accessing the id property
    Given a domain entity with a specific id
    When the id property is accessed
    Then it should return the correct id

  Scenario: Throwing a Permission Error
    When a permission error is thrown with a message
    Then it should be an instance of Error with the correct name and message