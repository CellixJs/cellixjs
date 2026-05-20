Feature: Update staff role

  Scenario: Successfully updates a staff role name
    Given a staff role with id "role-001" exists in the repository
    When I call update with roleId "role-001" and roleName "Updated Role"
    Then the staff role should be saved
    And the result should have roleName "Updated Role"

  Scenario: Successfully updates a staff role with an enterpriseAppRole
    Given a staff role with id "role-002" exists in the repository
    When I call update with roleId "role-002" and enterpriseAppRole "Staff.UpdatedRole"
    Then the staff role should be saved with enterpriseAppRole "Staff.UpdatedRole"

  Scenario: Successfully updates a staff role with community permissions
    Given a staff role with id "role-003" exists in the repository
    When I call update with roleId "role-003" and community permissions canManageCommunities true
    Then the staff role should be saved
    And the community permission canManageCommunities should be true

  Scenario: Successfully updates a staff role with user permissions
    Given a staff role with id "role-004" exists in the repository
    When I call update with roleId "role-004" and user permissions canManageUsers true
    Then the staff role should be saved
    And the user permission canManageUsers should be true

  Scenario: Does not apply enterpriseAppRole when it is not provided
    Given a staff role with id "role-005" exists in the repository
    When I call update with roleId "role-005" and no enterpriseAppRole
    Then the staff role enterpriseAppRole should remain unchanged

  Scenario: Throws when repository fails to save the updated role
    Given a staff role with id "role-err" exists in the repository
    And saving the staff role returns undefined
    When I call update with roleId "role-err" and roleName "Any Role"
    Then it should throw an error with message "Unable to update staff role"

  Scenario: Successfully updates a staff role with all community permissions set
    Given a staff role with id "role-all-comm" exists in the repository
    When I call update with all community permissions true
    Then all community permissions should be true on the updated instance

  Scenario: Successfully updates a staff role with canAssignStaffUserRoles set
    Given a staff role with id "role-assign" exists in the repository
    When I call update with user permissions canAssignStaffUserRoles true
    Then the user permission canAssignStaffUserRoles should be true

  Scenario: Omitting community permissions sub-object leaves community permissions unchanged
    Given a staff role with id "role-noc" exists in the repository
    When I call update with only user permissions
    Then all community permissions should remain false

  Scenario: Omitting user permissions sub-object leaves user permissions unchanged
    Given a staff role with id "role-nou" exists in the repository
    When I call update with only community permissions
    Then all user permissions should remain false

  Scenario: getById is called with the provided role id
    Given a staff role with id "role-lookup" exists in the repository
    When I call update with roleId "role-lookup" and roleName "Any Role"
    Then getById should have been called with "role-lookup"
