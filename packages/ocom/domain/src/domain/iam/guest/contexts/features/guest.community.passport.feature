Feature: <Passport> GuestCommunityPassport

  Scenario: Creating GuestCommunityPassport and getting visa for community
    When I create a GuestCommunityPassport
    And I have a community entity reference
    And I call forCommunity with the community reference
    Then it should return a CommunityVisa
    And the visa should deny all permissions

  Scenario: Using visa to determine permissions
    When I create a GuestCommunityPassport
    And I have a community entity reference
    And I get a visa for the community
    And I use determineIf to check any permission
    Then it should return false