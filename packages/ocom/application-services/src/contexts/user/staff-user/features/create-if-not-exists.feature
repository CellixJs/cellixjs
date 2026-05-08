Feature: Create staff user if not exists

  Scenario: Returns existing user when user already exists
    Given a staff user with externalId "ext-123" already exists
    When I call createIfNotExists with externalId "ext-123"
    Then it should return the existing user
    And it should not create a new user

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
