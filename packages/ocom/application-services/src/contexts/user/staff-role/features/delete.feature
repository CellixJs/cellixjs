Feature: Deleting a staff role

  Scenario: Deleting a staff role successfully
    Given a staff role with id "507f1f77bcf86cd799439011" exists
    When I delete role "507f1f77bcf86cd799439011"
    Then the role should be prepared for deletion, reassigned, and archived

  Scenario: Deleting a staff role that does not exist
    Given no staff role with id "507f1f77bcf86cd799439011" exists
    When I try to delete role "507f1f77bcf86cd799439011"
    Then it should throw an error

  Scenario: Deleting a staff role the domain refuses to delete
    Given a staff role with id "507f1f77bcf86cd799439011" exists whose deletion is not permitted
    When I try to delete role "507f1f77bcf86cd799439011"
    Then it should throw a permission error and not save the role

  Scenario: No matching default role exists
    Given a staff role with id "507f1f77bcf86cd799439011" exists
    And no matching default role exists
    When I try to delete role "507f1f77bcf86cd799439011"
    Then it should throw the missing default role error and leave the role active

  Scenario: Staff user reassignment fails
    Given a staff role with id "507f1f77bcf86cd799439011" exists
    And staff user reassignment fails
    When I try to delete role "507f1f77bcf86cd799439011"
    Then it should throw the reassignment error and leave deletion pending for retry

  Scenario: Retrying a completed staff role deletion
    Given staff role "507f1f77bcf86cd799439011" is already archived
    When I delete role "507f1f77bcf86cd799439011" again
    Then the completed deletion should succeed without another reassignment

  Scenario: Another request completes deletion first
    Given staff role "507f1f77bcf86cd799439011" is archived after reassignment
    When I delete role "507f1f77bcf86cd799439011"
    Then finalization should succeed without emitting another deletion
