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

  Scenario: Throws an error when the unit of work returns no result
    Given a staff user with id "user-123" exists
    And a staff role with id "role-456" exists
    And saving the staff user returns undefined
    When I call assignRole with staffUserId "user-123" and roleId "role-456"
    Then it should throw an error with message "Unable to assign role to staff user"

  Scenario: Compensates when the role is deleted during assignment
    Given a staff user with id "user-123" exists
    And role "role-456" is deleted after the staff user is saved
    When I call assignRole with staffUserId "user-123" and roleId "role-456"
    Then staff users assigned to role "role-456" should be reassigned using enterprise app role "role-role-456"
    And it should throw an error with message containing "no longer available"
