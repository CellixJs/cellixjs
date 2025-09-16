Feature: <Passport> GuestServicePassport

  Scenario: Creating GuestServicePassport and getting visa for service
    When I create a GuestServicePassport
    And I have a service entity reference
    And I call forService with the service reference
    Then it should return a ServiceVisa
    And the visa should deny all permissions

  Scenario: Using visa to determine permissions
    When I create a GuestServicePassport
    And I have a service entity reference
    And I get a visa for the service
    And I use determineIf to check any permission
    Then it should return false