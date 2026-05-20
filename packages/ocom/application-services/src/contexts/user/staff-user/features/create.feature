Feature: Create staff user

  Scenario: Successfully creates a new staff user without a role
    Given no staff user with externalId "ext-123" exists
    And no staff user with email "test@example.com" exists
    And no roleId is provided
    When I call create with externalId "ext-123", firstName "John", lastName "Doe", and email "test@example.com"
    Then the new staff user should be saved
    And the result should be the created staff user
    And the user should have no role assigned

  Scenario: Successfully creates a new staff user with a role
    Given no staff user with externalId "ext-456" exists
    And no staff user with email "test@example.com" exists
    And a staff role with id "role-001" exists
    When I call create with externalId "ext-456" and roleId "role-001"
    Then the new staff user should be saved
    And the result should be the created staff user
    And the user should have the role assigned

  Scenario: Generates a UUID externalId when none is provided
    Given no staff user with email "test@example.com" exists
    And no roleId is provided
    When I call create without an externalId
    Then the new staff user should be saved with a generated externalId

  Scenario: Throws when a staff user with the same externalId already exists
    Given a staff user with externalId "ext-dupe" already exists
    When I call create with externalId "ext-dupe"
    Then it should throw an error with message containing "ext-dupe"

  Scenario: Throws when a staff user with the same email already exists
    Given no staff user with externalId "ext-789" exists
    And a staff user with email "taken@example.com" already exists
    When I call create with externalId "ext-789" and email "taken@example.com"
    Then it should throw an error with message containing "taken@example.com"

  Scenario: Throws when repository fails to save the new user
    Given no staff user with externalId "ext-err" exists
    And no staff user with email "test@example.com" exists
    And no roleId is provided
    And saving the staff user returns undefined
    When I call create with externalId "ext-err"
    Then it should throw an error with message "Unable to create staff user"
