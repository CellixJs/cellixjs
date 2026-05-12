Feature: EndUserReadRepository

  Scenario: Creating End User Read Repository
    When I create a EndUserReadRepositoryImpl with models and passport
    Then I should receive a EndUserReadRepository instance
    And the repository should have all required methods

  Scenario: Getting all end users
    When I call getAll method
    Then I should receive an array of EndUserEntityReference objects

  Scenario: Getting end user by ID when exists
    Given an end user exists with ID "test-id"
    When I call getById with "test-id"
    Then I should receive the EndUserEntityReference object

  Scenario: Getting end user by ID when not exists
    Given no end user exists with ID "non-existent-id"
    When I call getById with "non-existent-id"
    Then I should receive null

  Scenario: Getting end user by external ID when exists
    Given an end user exists with external ID "ext-123"
    When I call getByExternalId with "ext-123"
    Then I should receive the EndUserEntityReference object

  Scenario: Getting end user by external ID when not exists
    Given no end user exists with external ID "non-existent-ext-id"
    When I call getByExternalId with "non-existent-ext-id"
    Then I should receive null

  Scenario: Getting end users by name
    Given end users exist with display name "Test User"
    When I call getByName with "Test User"
    Then I should receive an array of EndUserEntityReference objects

  Scenario: Getting end users by IDs returns results in input order
    Given end users exist with IDs "test-id" and "other-id"
    When I call getByIds with those IDs
    Then I should receive end users in the same order as the input IDs

  Scenario: Getting end users by IDs returns null for missing entries
    Given only end user with ID "test-id" exists
    When I call getByIds with "test-id" and "missing-id"
    Then I should receive the found end user and null for the missing ID

  Scenario: Getting end users by IDs with an empty list returns empty array
    When I call getByIds with an empty list
    Then I should receive an empty array