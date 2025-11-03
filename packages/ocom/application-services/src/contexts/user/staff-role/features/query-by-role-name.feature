Feature: Querying a staff role by role name

  Scenario: Querying a staff role by role name successfully
    Given a staff role with name "Test Role" exists
    When I query for staff role with name "Test Role"
    Then it should return the staff role entity reference

  Scenario: Querying a staff role by role name that does not exist
    Given no staff role with name "Test Role" exists
    When I query for staff role with name "Test Role"
    Then it should return null

  Scenario: Querying a staff role by role name when repository throws an error
    Given the repository will throw a database error
    When I query for staff role with name "Test Role"
    Then it should throw an error