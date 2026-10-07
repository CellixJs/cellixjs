Feature: <Passport> GuestVideoPassport

  Scenario: Guests are denied every video permission
    When I create a GuestVideoPassport and get a visa for a video
    Then the visa should deny all permissions

  Scenario: Guests are denied every video viewing permission
    When I create a GuestVideoPassport and get a visa for a video viewing
    Then the visa should deny all permissions
