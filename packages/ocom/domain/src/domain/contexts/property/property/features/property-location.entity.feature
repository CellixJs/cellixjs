Feature: <Entity> Property Location Entity

  Scenario: Creating a property location with valid props
    When I create a property location with valid address and position
    Then the property location should be created successfully

  Scenario: Setting address with proper permissions
    Given a property location exists
    When I set the address with proper permissions
    Then the address should be updated

  Scenario: Setting address without proper permissions
    Given a property location exists
    When I try to set the address without proper permissions
    Then a permission error should be thrown

  Scenario: Setting position with proper permissions
    Given a property location exists
    When I set the position with proper permissions
    Then the position should be updated

  Scenario: Setting position without proper permissions
    Given a property location exists
    When I try to set the position without proper permissions
    Then a permission error should be thrown