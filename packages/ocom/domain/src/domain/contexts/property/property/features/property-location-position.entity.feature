Feature: <Entity> Property Location Position Entity

  Scenario: Creating a property location position with valid props
    When I create a property location position with valid type and coordinates
    Then the property location position should be created successfully

  Scenario: Accessing type property
    Given a property location position exists
    When I access the type property
    Then it should return the correct type

  Scenario: Accessing coordinates property
    Given a property location position exists
    When I access the coordinates property
    Then it should return the correct coordinates