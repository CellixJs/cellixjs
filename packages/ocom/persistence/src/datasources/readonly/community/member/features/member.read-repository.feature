Feature: MemberReadRepository

  Scenario: Creating Member Read Repository
    When I create a MemberReadRepositoryImpl with models and passport
    Then I should receive a MemberReadRepository instance
    And the repository should have all required methods

  Scenario: Getting members by community ID
    When I call getByCommunityId with "507f1f77bcf86cd799439011"
    Then I should receive an array of MemberEntityReference objects

  Scenario: Getting member by ID when exists
    Given a member exists with ID "member-123"
    When I call getById with "member-123"
    Then I should receive the MemberEntityReference object

  Scenario: Getting member by ID when not exists
    Given no member exists with ID "non-existent-id"
    When I call getById with "non-existent-id"
    Then I should receive null

  Scenario: Getting member by ID with role
    Given a member exists with ID "member-123"
    When I call getByIdWithRole with "member-123"
    Then I should receive the MemberEntityReference object with role populated

  Scenario: Getting members for end user external ID
    Given an end user exists with external ID "user-456"
    When I call getMembersForEndUserExternalId with "user-456"
    Then I should receive an array of MemberEntityReference objects for that user

  Scenario: Checking if member is admin
    Given a member exists with ID "admin-member"
    When I call isAdmin with "admin-member"
    Then I should receive a boolean indicating admin status