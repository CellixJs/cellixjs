Feature: <Service> StaffRoleDeletedReassignmentService

  Background:
    Given a StaffRoleDeletedReassignmentService instance
    And a valid domainDataSource with staff role and staff user repositories
    And a default staff role with id "default-role-1" and enterpriseAppRole "Staff.CaseManager"

  Scenario: Reassigning staff users assigned to the deleted role to the matching default role
    Given two staff users assigned to the deleted role "deleted-role-1"
    When I call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.CaseManager"
    Then each assigned staff user should be reassigned to the default role "default-role-1"
    And each reassigned staff user should be saved

  Scenario: Reassignment is idempotent for staff users already assigned to the default role
    Given a staff user already assigned to the default role "default-role-1"
    When I call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.CaseManager"
    Then that staff user should not be reassigned again
    And no staff user should be saved

  Scenario: No staff users are assigned to the deleted role
    Given no staff users assigned to the deleted role "deleted-role-1"
    When I call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.CaseManager"
    Then no staff user should be saved

  Scenario: Failing when no default role matches the deleted role's enterpriseAppRole
    Given no default staff role exists for enterpriseAppRole "Staff.Unmatched"
    When I try to call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.Unmatched"
    Then the missing default role failure should be logged and rethrown
    And no staff user should be saved
