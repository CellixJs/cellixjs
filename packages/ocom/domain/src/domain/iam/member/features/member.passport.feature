Feature: <Passport> MemberPassport

  Background:
    Given a valid EndUserEntityReference
    And a valid MemberEntityReference with at least one account for the user and a matching community
    And a valid CommunityEntityReference

  Scenario: Creating a MemberPassport with valid user, member, and community
    When I create a MemberPassport with the user, member, and community
    Then the passport should be created successfully

  Scenario: Creating a MemberPassport with a user who is not a member
    Given a MemberEntityReference with no account for the user
    When I try to create a MemberPassport with the user, member, and community
    Then an error should be thrown indicating the user is not a member of the community

  Scenario: Creating a MemberPassport with a member whose community does not match
    Given a MemberEntityReference whose community does not match the provided CommunityEntityReference
    When I try to create a MemberPassport with the user, member, and community
    Then an error should be thrown indicating the member is not part of the community

  Scenario: Accessing the community passport
    When I create a MemberPassport with valid user, member, and community
    And I access the community property
    Then I should receive a MemberCommunityPassport instance with all visas

  Scenario: Accessing the service passport
    When I create a MemberPassport with valid user, member, and community
    And I access the service property
    Then I should receive a MemberServicePassport instance with all visas

  Scenario: Accessing the user passport
    When I create a MemberPassport with valid user, member, and community
    And I access the user property
    Then I should receive a MemberUserPassport instance with all visas

  Scenario: Accessing the property passport
    When I create a MemberPassport with valid user, member, and community
    And I access the property property
    Then I should receive a MemberPropertyPassport instance with all visas

  Scenario: Accessing the case passport
    When I create a MemberPassport with valid user, member, and community
    And I access the case property
    Then I should receive a MemberCasePassport instance with all visas