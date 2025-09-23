Feature: CommunityReadRepository

  Scenario: Creating Community Read Repository
    When I create a CommunityReadRepositoryImpl with models and passport
    Then I should receive a CommunityReadRepository instance
    And the repository should have all required methods

  Scenario: Getting all communities
    When I call getAll method
    Then I should receive an array of CommunityEntityReference objects

  Scenario: Getting community by ID when exists
    Given a community exists with ID "test-id"
    When I call getById with "test-id"
    Then I should receive the CommunityEntityReference object

  Scenario: Getting community by ID when not exists
    Given no community exists with ID "non-existent-id"
    When I call getById with "non-existent-id"
    Then I should receive null

  Scenario: Getting community by ID with createdBy
    Given a community exists with ID "test-id"
    When I call getByIdWithCreatedBy with "test-id"
    Then I should receive the CommunityEntityReference object with createdBy populated

  Scenario: Getting communities by end user external ID
    Given an end user exists with external ID "user-123"
    When I call getByEndUserExternalId with "user-123"
    Then I should receive an array of CommunityEntityReference objects for that user