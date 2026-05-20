Feature: Create staff user if not exists

  Scenario: Returns existing user when user already exists
    Given a staff user with externalId "ext-123" already exists
    When I call createIfNotExists with externalId "ext-123"
    Then it should return the existing user
    And it should not create a new user

  Scenario: Updates externalId when user exists by email
    Given a staff user with email "first@example.com" already exists
    When I call createIfNotExists with externalId "ext-new"
    Then it should update the existing user's externalId
    And it should return the updated user

  Scenario: Creates a new user when user does not exist
    Given no staff user with externalId "ext-456" exists
    And no matching AAD role is provided
    When I call createIfNotExists with externalId "ext-456"
    Then it should call createDefaultRoles
    And it should create a new user with the provided details
    And it should return the newly created user

  Scenario: Creates a new user with a matching role when AAD role matches
    Given no staff user with externalId "ext-789" exists
    And the AAD roles include "Staff.CaseManager"
    And the "Staff.CaseManager" role exists in the repository
    When I call createIfNotExists with externalId "ext-789"
    Then it should assign the "Staff.CaseManager" role to the new user

  Scenario: Assigns Default.TechAdmin when AAD role is enterprise app role
    Given no staff user with externalId "ext-201" exists
    And the AAD roles include "Staff.TechAdmin"
    And the "Default.TechAdmin" role exists in the repository
    When I call createIfNotExists with externalId "ext-201"
    Then it should assign the "Default.TechAdmin" role to the new user

  Scenario: Assigns highest priority matching role when multiple AAD roles are provided
    Given no staff user with externalId "ext-202" exists
    And the AAD roles include "Unknown.Role", "Staff.TechAdmin", and "Staff.CaseManager"
    And the "Default.TechAdmin" and "Default.CaseManager" roles exist in the repository
    When I call createIfNotExists with externalId "ext-202"
    Then it should assign the "Default.TechAdmin" role to the new user

  Scenario: Creates a new user without a role when AAD role has alternate formatting
    Given no staff user with externalId "ext-203" exists
    And the AAD roles include "default tech admin"
    When I call createIfNotExists with externalId "ext-203"
    Then it should create the user without assigning a role

  Scenario: Creates a new user without a role when no AAD role matches
    Given no staff user with externalId "ext-000" exists
    And the AAD roles include "Unknown.Role"
    When I call createIfNotExists with externalId "ext-000"
    Then it should create the user without assigning a role

  Scenario: Creates a new user without a role when AAD roles list is empty
    Given no staff user with externalId "ext-111" exists
    And the AAD roles list is empty
    When I call createIfNotExists with externalId "ext-111"
    Then it should create the user without assigning a role

  Scenario: Throws when repository fails to save the new user
    Given no staff user with externalId "ext-err" exists
    When I call createIfNotExists with externalId "ext-err"
    Then it should throw an error with message "Unable to create staff user"

  Scenario: Creates a new user when email is empty
    Given no staff user with externalId "ext-noemail" exists
    And the command has an empty email
    When I call createIfNotExists with externalId "ext-noemail"
    Then it should not check for an existing user by email
    And it should return the newly created user

  Scenario: Creates a new user when email lookup returns no match
    Given no staff user with externalId "ext-nomatch" exists
    And a staff user with email "other@example.com" does not exist
    When I call createIfNotExists with externalId "ext-nomatch"
    Then it should create a new user
    And it should return the newly created user

  Scenario: Throws when update of externalId fails to save
    Given a staff user with email "first@example.com" already exists
    And the update transaction save returns undefined
    When I call createIfNotExists with externalId "ext-updfail"
    Then it should throw an error with message "Unable to update staff user externalId"

  Scenario: Propagates non-NotFound errors from role lookup
    Given no staff user with externalId "ext-rolerr" exists
    And the role repository throws a non-NotFound error for any AAD role
    When I call createIfNotExists with externalId "ext-rolerr"
    Then it should propagate the role repository error
