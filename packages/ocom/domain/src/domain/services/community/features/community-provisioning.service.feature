Feature: <Service> CommunityProvisioningService

  Background:
    Given a CommunityProvisioningService instance
    And a valid domainDataSource with community, role, and member repositories
    And a valid community with id "community-123" and createdBy user "user-123"

  Scenario: Successfully provisioning member and default role
    Given a community with id "community-123" exists
    And the community has a valid createdBy user with displayName "John Doe"
    And the user has personal information with firstName "John" and lastName "Doe"
    When I call provisionMemberAndDefaultRole with communityId "community-123"
    Then a default admin role should be created for the community
    And the role permissions should be set to default admin permissions
    And a new member should be created with the createdBy user
    And the member should be assigned the admin role
    And the member should have a new account with the user details

  Scenario: Failing to provision when community not found
    Given no community exists with id "nonexistent-community"
    When I try to call provisionMemberAndDefaultRole with communityId "nonexistent-community"
    Then a "Community not found" error should be thrown

  Scenario: Failing to provision when role creation fails
    Given a community with id "community-123" exists
    And the role repository save operation returns null
    When I try to call provisionMemberAndDefaultRole with communityId "community-123"
    Then a "Failed to provision default role for Community ID community-123" error should be thrown

  Scenario: Failing to provision when community has no createdBy user
    Given a community with id "community-123" exists
    And the community has no createdBy user
    When I try to call provisionMemberAndDefaultRole with communityId "community-123"
    Then a "CreatedBy ID is required to provision member and default role for Community ID community-123" error should be thrown

  Scenario: Provisioning with missing user identity details
    Given a community with id "community-123" exists
    And the community has a createdBy user with no identity details
    When I call provisionMemberAndDefaultRole with communityId "community-123"
    Then a default admin role should be created for the community
    And a new member should be created with empty name fields
    And the member account should still be created successfully