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
    And the deleted role reassignment should be marked complete

  Scenario: Reassignment does not overwrite a newer concurrent role assignment
    Given a candidate staff user whose role changes before the conditional update
    When I call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.CaseManager"
    Then the conditional update should be allowed to report no change

  Scenario: Reassigning a large role in committed batches
    Given twenty-five staff users assigned to the deleted role "deleted-role-1"
    When I call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.CaseManager"
    Then the staff users should be reassigned in three bounded transactions
    And all twenty-five conditional role updates should be attempted
    And the deleted role reassignment should be marked complete

  Scenario: A later batch failure preserves earlier reassignment progress
    Given fifteen staff users assigned to the deleted role "deleted-role-1"
    And the second reassignment batch will fail
    When I try to call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.CaseManager"
    Then ten conditional role updates should have completed before the failure
    And five staff users should remain for recovery
    And the deleted role reassignment should not be marked complete
    And the batch failure should be rethrown

  Scenario: No staff users are assigned to the deleted role
    Given no staff users assigned to the deleted role "deleted-role-1"
    When I call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.CaseManager"
    Then no conditional role update should be attempted
    And the deleted role reassignment should be marked complete

  Scenario: Failing when no default role matches the deleted role's enterpriseAppRole
    Given no default staff role exists for enterpriseAppRole "Staff.Unmatched"
    When I try to call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.Unmatched"
    Then the missing default role failure should be logged and rethrown
    And no conditional role update should be attempted
    And the deleted role reassignment should not be marked complete

  Scenario: Surfacing a reassignment completion marker failure
    Given no staff users assigned to the deleted role "deleted-role-1"
    And marking the deleted role reassignment complete will fail
    When I try to call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.CaseManager"
    Then the completion marker failure should be rethrown
