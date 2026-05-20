Feature: Create staff role

  Scenario: Successfully creates a staff role with no permissions
    Given a staff role with name "Test Role" does not exist in the repository
    When I call create with roleName "Test Role" and no permissions
    Then the new staff role should be saved
    And the result should have roleName "Test Role"

  Scenario: Successfully creates a staff role with an enterpriseAppRole
    Given a staff role with name "Test Role" does not exist in the repository
    When I call create with roleName "Test Role" and enterpriseAppRole "Staff.TestRole"
    Then the new staff role should be saved with enterpriseAppRole "Staff.TestRole"

  Scenario: Successfully creates a staff role with community permissions
    Given a staff role with name "Admin Role" does not exist in the repository
    When I call create with roleName "Admin Role" and community permissions canManageCommunities true
    Then the new staff role should be saved
    And the community permission canManageCommunities should be true

  Scenario: Successfully creates a staff role with user permissions
    Given a staff role with name "Manager Role" does not exist in the repository
    When I call create with roleName "Manager Role" and user permissions canManageUsers true
    Then the new staff role should be saved
    And the user permission canManageUsers should be true

  Scenario: Throws when a staff role with the same name already exists
    Given a staff role with name "Duplicate Role" already exists in the repository
    When I call create with roleName "Duplicate Role"
    Then it should throw an error with message containing "Duplicate Role"

  Scenario: Propagates unexpected repository errors from getByRoleName
    Given the repository throws an unexpected error when checking for "Error Role"
    When I call create with roleName "Error Role"
    Then it should throw the unexpected error

  Scenario: Throws when repository fails to save the new role
    Given a staff role with name "Test Role" does not exist in the repository
    And saving the staff role returns undefined
    When I call create with roleName "Test Role" and no permissions
    Then it should throw an error with message "Unable to create staff role"
