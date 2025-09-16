Feature: <Passport> GuestPassport

  Scenario: Creating GuestPassport and accessing community passport
    When I create a GuestPassport
    And I access the community property
    Then it should return a GuestCommunityPassport instance
    And accessing community property again should return the same instance

  Scenario: Creating GuestPassport and accessing service passport
    When I create a GuestPassport
    And I access the service property
    Then it should return a GuestServicePassport instance
    And accessing service property again should return the same instance

  Scenario: Creating GuestPassport and accessing user passport
    When I create a GuestPassport
    And I access the user property
    Then it should return a GuestUserPassport instance
    And accessing user property again should return the same instance