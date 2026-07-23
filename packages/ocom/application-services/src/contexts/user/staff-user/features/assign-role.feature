Feature: Assign role to staff user

  Scenario: Successfully assigns a role to an existing staff user
    Given a staff user with id "user-123" exists
    And a staff role with id "role-456" exists
    When I call assignRole with staffUserId "user-123" and roleId "role-456"
    Then the staff user should be saved with the role assigned
    And the result should be the updated staff user
    And the staff role should be validated before and after assignment

  Scenario: Throws an error when the staff role does not exist
    Given a staff user with id "user-123" exists
    And no staff role with id "role-999" exists in the repository
    When I call assignRole with staffUserId "user-123" and roleId "role-999"
    Then it should throw an error with message containing "role-999"

  Scenario: Rejects a logically deleted staff role before assignment
    Given a staff user with id "user-123" exists
    And a deleted staff role with id "role-456" exists
    When I call assignRole with staffUserId "user-123" and roleId "role-456"
    Then the deleted role should not be assigned
    And it should throw an error with message containing "not available"

  Scenario: Throws an error when the unit of work returns no result
    Given a staff user with id "user-123" exists
    And a staff role with id "role-456" exists
    And saving the staff user returns undefined
    When I call assignRole with staffUserId "user-123" and roleId "role-456"
    Then it should throw an error with message "Unable to assign role to staff user"

  Scenario: Rolls back when the role is deleted during assignment
    Given a staff user with id "user-123" is assigned to role "role-previous"
    And role "role-456" is deleted after the staff user is saved
    When I call assignRole with staffUserId "user-123" and roleId "role-456"
    Then the committed role "role-456" should be conditionally replaced with "role-previous"
    And no independent bulk reassignment should be started
    And it should throw an error with message containing "no longer available"

  Scenario: Rolls back a committed assignment when role verification fails
    Given a staff user with id "user-123" is assigned to role "role-previous"
    And role "role-456" verification fails after the staff user is saved
    When I call assignRole with staffUserId "user-123" and roleId "role-456"
    Then the committed role "role-456" should be conditionally replaced with "role-previous"
    And it should report the role verification failure

  Scenario: Does not overwrite a newer assignment during rollback
    Given a staff user with id "user-123" is assigned to role "role-previous"
    And role "role-456" is deleted after the staff user is saved
    And the conditional rollback loses to a newer assignment
    When I call assignRole with staffUserId "user-123" and roleId "role-456"
    Then the newer assignment should be preserved
    And it should report that compensation did not complete

  Scenario: Rolls an initially unassigned user back to no role
    Given a staff user with id "user-123" has no role
    And role "role-456" verification fails after the staff user is saved
    When I call assignRole with staffUserId "user-123" and roleId "role-456"
    Then the committed role "role-456" should be conditionally removed
    And it should report the role verification failure
