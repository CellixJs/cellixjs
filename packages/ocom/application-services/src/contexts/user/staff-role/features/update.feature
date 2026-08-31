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

  Scenario: Throws a friendly error when the staff role does not exist
    Given no staff role with id "role-missing" exists in the repository
    When I call update with roleId "role-missing" and roleName "Any Role"
    Then it should throw an error with message "Staff role not found"

  Scenario: Rejects updating a role whose current tier the caller cannot manage
    Given a staff role with id "role-tier" exists with enterprise app role "Staff.TechAdmin"
    When I call update allowing only the "Staff.CaseManager" tier
    Then it should throw an error containing "update a role of enterprise app role type: Staff.TechAdmin"
    And the staff role should not be saved

  Scenario: Rejects updating an unclassified role when the caller cannot manage unclassified roles
    Given a staff role with id "role-unclassified" exists with a blank enterprise app role
    When I call update allowing only the "Staff.CaseManager" tier
    Then it should throw an error containing "update a role without an enterprise app role type"
    And the staff role should not be saved

  Scenario: Rejects granting a permission flag outside the caller's grantable flags
    Given a staff role with id "role-grant" exists with enterprise app role "Staff.CaseManager"
    When I call update requesting canManageAllCommunities without that grantable flag
    Then it should throw an error with message "You do not have permission to grant the permission: canManageAllCommunities"
    And the staff role should not be saved

  Scenario: Allows re-saving a permission flag the role already holds
    Given a staff role with id "role-keep" exists that already has canManageAllCommunities
    When I call update requesting canManageAllCommunities without that grantable flag
    Then the staff role should be saved

  Scenario: Allows revoking a permission flag outside the caller's grantable flags
    Given a staff role with id "role-revoke" exists that already has canManageAllCommunities
    When I call update revoking canManageAllCommunities without that grantable flag
    Then the staff role should be saved
    And the community permission canManageAllCommunities should be false
