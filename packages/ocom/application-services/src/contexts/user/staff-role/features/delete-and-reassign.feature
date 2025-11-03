Feature: Deleting and reassigning a staff role

  Scenario: Deleting and reassigning a staff role successfully
    Given a staff role with id "507f1f77bcf86cd799439011" exists
    Given a staff role with id "507f1f77bcf86cd799439012" exists
    When I delete and reassign role "507f1f77bcf86cd799439011" to role "507f1f77bcf86cd799439012"
    Then the operation should complete successfully

  Scenario: Deleting a staff role that does not exist
    Given no staff role with id "507f1f77bcf86cd799439011" exists
    When I delete and reassign role "507f1f77bcf86cd799439011" to role "507f1f77bcf86cd799439012"
    Then it should throw an error

  Scenario: Reassigning to a staff role that does not exist
    Given a staff role with id "507f1f77bcf86cd799439011" exists
    Given no staff role with id "507f1f77bcf86cd799439012" exists
    When I delete and reassign role "507f1f77bcf86cd799439011" to role "507f1f77bcf86cd799439012"
    Then it should throw an error