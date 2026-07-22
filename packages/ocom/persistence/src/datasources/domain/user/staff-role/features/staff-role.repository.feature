Feature: <Repository> StaffRoleRepository

  Background:
    Given a StaffRoleRepository instance with a working Mongoose model, type converter, and passport
    And a valid Mongoose StaffRole document with id "role-1", roleName "Manager", isDefault false, and roleType "staff"

  Scenario: Getting a staff role by id
    When I call getById with "role-1"
    Then I should receive a StaffRole domain object
    And the domain object's roleName should be "Manager"
    And the domain object's isDefault should be false
    And the domain object's roleType should be "staff"

  Scenario: Getting a staff role by id that does not exist
    When I call getById with "nonexistent-id"
    Then an error should be thrown indicating "StaffRole with id nonexistent-id not found"

  Scenario: Getting an archived staff role for deletion retry
    Given the staff role is archived
    When I call getByIdForDeletion with "role-1"
    Then I should receive the archived StaffRole domain object

  Scenario: Getting an active staff role for assignment
    When I call getByIdForAssignment with "role-1"
    Then I should receive a StaffRole domain object
    And only an active staff role should be queried in the current session

  Scenario: Rejecting a staff role pending deletion for assignment
    Given the staff role is pending deletion
    When I call getByIdForAssignment with "role-1"
    Then an error should be thrown indicating "StaffRole with id role-1 not found"

  Scenario: Getting a staff role deletion status
    Given the staff role is archived
    When I call getDeletionStatus with "role-1"
    Then the deletion status should be "deleted"

  Scenario: Resolving the replacement role recorded for deletion
    Given the staff role is pending deletion with replacement role "default-role-1"
    When I call getReplacementRoleForDeletion with "role-1"
    Then I should receive the default replacement StaffRole domain object
    And the recorded replacement role id should be queried

  Scenario: Getting a staff role by roleName
    When I call getByRoleName with "Manager"
    Then I should receive a StaffRole domain object
    And the domain object's roleName should be "Manager"
    And the domain object's isDefault should be false
    And the domain object's roleType should be "staff"

  Scenario: Getting a staff role by roleName that does not exist
    When I call getByRoleName with "nonexistent-role"
    Then an error should be thrown indicating "StaffRole with roleName nonexistent-role not found"

  Scenario: Getting a default staff role by enterpriseAppRole
    Given a valid default Mongoose StaffRole document with enterpriseAppRole "Staff.CaseManager"
    When I call getDefaultRoleByEnterpriseAppRole with "Staff.CaseManager"
    Then I should receive a StaffRole domain object
    And the domain object's isDefault should be true

  Scenario: Getting a default staff role by enterpriseAppRole that does not exist
    When I call getDefaultRoleByEnterpriseAppRole with "Staff.UnknownRole"
    Then an error should be thrown indicating "Default StaffRole with enterpriseAppRole Staff.UnknownRole not found"

  Scenario: Creating a new staff role instance
    When I call getNewInstance with name "Supervisor"
    Then I should receive a new StaffRole domain object
    And the domain object's roleName should be "Supervisor"
    And the domain object's isDefault should be false
    And the domain object's roleType should be "staff"