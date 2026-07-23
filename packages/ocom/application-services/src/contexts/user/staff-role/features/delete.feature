Feature: Deleting a staff role

  Scenario: Deleting a staff role successfully
    Given a staff role with id "507f1f77bcf86cd799439011" exists
    When I delete role "507f1f77bcf86cd799439011"
    Then the role should be marked for deletion and saved

  Scenario: Deleting a staff role that does not exist
    Given no staff role with id "507f1f77bcf86cd799439011" exists
    When I try to delete role "507f1f77bcf86cd799439011"
    Then it should throw an error

  Scenario: Deleting a staff role the domain refuses to delete
    Given a staff role with id "507f1f77bcf86cd799439011" exists whose deletion is not permitted
    When I try to delete role "507f1f77bcf86cd799439011"
    Then it should throw a permission error and not save the role

  Scenario: Restoring a staff role when reassignment processing fails
    Given a staff role with id "507f1f77bcf86cd799439011" exists
    And its deletion commits but the StaffRoleDeletedEvent handler fails
    When I try to delete role "507f1f77bcf86cd799439011"
    Then the deleted role should be restored in a new transaction
    And the post-commit processing failure should be rethrown

  Scenario: Surfacing deletion and restoration failures together
    Given a staff role with id "507f1f77bcf86cd799439011" exists
    And its deletion commits but the StaffRoleDeletedEvent handler fails
    And restoring the deleted role also fails
    When I try to delete role "507f1f77bcf86cd799439011"
    Then both the processing and restoration failures should be surfaced
