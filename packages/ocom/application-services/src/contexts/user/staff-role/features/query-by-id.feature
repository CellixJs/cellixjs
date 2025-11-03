Feature: Querying a staff role by ID

  Scenario: Querying a staff role by ID successfully
    Given a staff role with id "507f1f77bcf86cd799439011" exists
    When I query for staff role with id "507f1f77bcf86cd799439011"
    Then it should return the staff role entity reference

  Scenario: Querying a staff role by ID that does not exist
    Given no staff role with id "507f1f77bcf86cd799439011" exists
    When I query for staff role with id "507f1f77bcf86cd799439011"
    Then it should return null

  Scenario: Querying a staff role by ID when repository throws an error
    Given the repository will throw a database error
    When I query for staff role with id "507f1f77bcf86cd799439011"
    Then it should throw an error