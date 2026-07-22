Feature: <Service> StaffRoleDeletedReassignmentService

  Background:
    Given a StaffRoleDeletedReassignmentService instance
    And valid staff role and staff user repositories
    And deleted role "deleted-role-1" records default staff role "default-role-1" as its replacement
    And reassignment is performed by staff user "actor-1"

  Scenario: Reassigning staff users assigned to the deleted role to the matching default role
    Given two staff users assigned to the deleted role "deleted-role-1"
    When I call reassignStaffUsersToDefaultRole for role "deleted-role-1"
    Then each assigned staff user should be reassigned to the default role "default-role-1"
    And each reassigned staff user should be saved

  Scenario: No staff users are assigned to the deleted role
    Given no staff users assigned to the deleted role "deleted-role-1"
    When I call reassignStaffUsersToDefaultRole for role "deleted-role-1"
    Then no staff user should be saved

  Scenario: Reassigning staff users in bounded batches
    Given twelve staff users assigned to the deleted role "deleted-role-1"
    When I call reassignStaffUsersToDefaultRole for role "deleted-role-1"
    Then all twelve staff users should be saved in batches of at most 10

  Scenario: Retrying after a later batch fails
    Given twelve staff users assigned to the deleted role "deleted-role-1"
    And the second reassignment batch fails
    When I retry reassignStaffUsersToDefaultRole for role "deleted-role-1"
    Then the retry should resume with the two staff users that remain assigned

  Scenario: Failing when the deleted role has no resolvable replacement
    Given no replacement staff role can be resolved for "deleted-role-1"
    When I try to call reassignStaffUsersToDefaultRole for role "deleted-role-1"
    Then the missing replacement role failure should be logged and rethrown
    And no staff user should be saved
