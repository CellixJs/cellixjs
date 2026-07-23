Feature: <Service> StaffRoleDeletedReassignmentService

  Background:
    Given a StaffRoleDeletedReassignmentService instance
    And a valid domainDataSource with staff role and staff user repositories
    And a default staff role with id "default-role-1" and enterpriseAppRole "Staff.CaseManager"

  Scenario: Reassigning staff users assigned to the deleted role to the matching default role
    Given two staff users assigned to the deleted role "deleted-role-1"
    When I call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.CaseManager"
    Then each assigned staff user should be conditionally reassigned to the default role "default-role-1"
    And each conditional update should record the initiating actor

  Scenario: Reassignment does not overwrite a newer concurrent role assignment
    Given a candidate staff user whose role changes before the conditional update
    When I call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.CaseManager"
    Then the conditional update should be allowed to report no change

  Scenario: No staff users are assigned to the deleted role
    Given no staff users assigned to the deleted role "deleted-role-1"
    When I call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.CaseManager"
    Then no conditional role update should be attempted

  Scenario: Failing when no default role matches the deleted role's enterpriseAppRole
    Given no default staff role exists for enterpriseAppRole "Staff.Unmatched"
    When I try to call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.Unmatched"
    Then the missing default role failure should be logged and rethrown
    And no conditional role update should be attempted
