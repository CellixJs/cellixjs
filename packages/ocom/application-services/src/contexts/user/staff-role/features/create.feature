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

  Scenario: enterpriseAppRole is not set when not provided in the command
    Given a staff role with name "Test Role" does not exist in the repository
    When I call create with roleName "Test Role" and no permissions
    Then the enterpriseAppRole on the saved instance should remain empty

  Scenario: Not-found detected via error name NotFoundError allows creation to proceed
    Given the repository raises a NotFoundError by name when checking for "New Role"
    When I call create with roleName "New Role" and no permissions
    Then the new staff role should be saved

  Scenario: Successfully creates a staff role with all community permissions set
    Given a staff role with name "Full Community Role" does not exist in the repository
    When I call create with roleName "Full Community Role" and all community permissions true
    Then all community permissions should be true on the saved instance

  Scenario: Successfully creates a staff role with canAssignStaffUserRoles set
    Given a staff role with name "Assign Role" does not exist in the repository
    When I call create with roleName "Assign Role" and user permissions canAssignStaffUserRoles true
    Then the user permission canAssignStaffUserRoles should be true

  Scenario: Omitting community permissions sub-object leaves community permissions unchanged
    Given a staff role with name "Test Role" does not exist in the repository
    When I call create with roleName "Test Role" and only user permissions
    Then all community permissions should remain false

  Scenario: Omitting user permissions sub-object leaves user permissions unchanged
    Given a staff role with name "Test Role" does not exist in the repository
    When I call create with roleName "Test Role" and only community permissions
    Then all user permissions should remain false

  Scenario: getNewInstance is called with the provided role name
    Given a staff role with name "Named Role" does not exist in the repository
    When I call create with roleName "Named Role" and no permissions
    Then getNewInstance should have been called with "Named Role"
