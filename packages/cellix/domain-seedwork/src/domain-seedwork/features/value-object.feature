Feature: ValueObject

  Scenario: Constructing a Value Object
    Given a set of properties
    When the value object is constructed
    Then it should initialize the properties correctly

  Scenario: Accessing value object properties
    Given a value object with specific properties
    When I access the properties
    Then I should get the correct values