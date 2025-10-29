Feature: <Entity> Property Listing Detail Bedroom Detail Entity

  Scenario: Creating a bedroom detail with valid props
    When I create a bedroom detail with valid room name and bed descriptions
    Then the bedroom detail should be created successfully

  Scenario: Setting room name with proper permissions
    Given a bedroom detail exists
    When I set the room name with proper permissions
    Then the room name should be updated

  Scenario: Setting room name without proper permissions
    Given a bedroom detail exists
    When I try to set the room name without proper permissions
    Then a permission error should be thrown

  Scenario: Setting bed descriptions with proper permissions
    Given a bedroom detail exists
    When I set the bed descriptions with proper permissions
    Then the bed descriptions should be updated

  Scenario: Setting bed descriptions without proper permissions
    Given a bedroom detail exists
    When I try to set the bed descriptions without proper permissions
    Then a permission error should be thrown