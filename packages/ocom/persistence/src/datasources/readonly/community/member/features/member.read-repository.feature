Feature: MemberReadRepository

  Scenario: Creating Member Read Repository
    When I create a MemberReadRepositoryImpl with models and passport
    Then I should receive a MemberReadRepository instance
    And the repository should have all required methods

  Scenario: Getting members by community ID
    When I call getByCommunityId with "507f1f77bcf86cd799439011"
    Then I should receive an array of MemberEntityReference objects

  Scenario: Getting members by community ID with custom populate fields
    When I call getByCommunityId with "507f1f77bcf86cd799439011" and custom populateFields
    Then I should receive members with merged populate fields

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

  Scenario: Getting member by ID with role when not exists
    Given no member exists with ID "non-existent-id"
    When I call getByIdWithRole with "non-existent-id"
    Then I should receive null

  Scenario: Getting member by ID with community, role and user
    Given a member exists with ID "member-123"
    When I call getByIdWithCommunityAndRoleAndUser with "member-123"
    Then I should receive the MemberEntityReference object with all fields populated

  Scenario: Getting member by ID with community, role and user when not exists
    Given no member exists with ID "non-existent-id"
    When I call getByIdWithCommunityAndRoleAndUser with "non-existent-id"
    Then I should receive null

  Scenario: Checking if member name exists in community
    Given a member with name "John Doe" exists in community "507f1f77bcf86cd799439011"
    When I call memberNameExistsInCommunity with "John Doe" and "507f1f77bcf86cd799439011"
    Then I should receive true

  Scenario: Checking if member name does not exist in community
    Given no member with name "Jane Smith" exists in community "507f1f77bcf86cd799439011"
    When I call memberNameExistsInCommunity with "Jane Smith" and "507f1f77bcf86cd799439011"
    Then I should receive false

  Scenario: Getting members for end user external ID
    Given an end user exists with external ID "user-456"
    When I call getMembersForEndUserExternalId with "user-456"
    Then I should receive an array of MemberEntityReference objects for that user

  Scenario: Checking if member is admin
    Given a member exists with ID "admin-member"
    When I call isAdmin with "admin-member"
    Then I should receive a boolean indicating admin status

  Scenario: Checking if member is admin when not an admin
    Given a member exists with ID "non-admin-member" with no special permissions
    When I call isAdmin with "non-admin-member"
    Then I should receive false

  Scenario: Checking if member is admin when member not found
    Given no member exists with ID "non-existent-member"
    When I call isAdmin with "non-existent-member"
    Then I should receive false