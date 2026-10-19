Feature: <ValueObject> CommunitySettings

  Scenario: Setting a new IP address with permission
    Given community settings with permission to manage community settings and an existing country
    When I set the ipAddress to "198.51.100.20"
    Then the ipAddress should be "198.51.100.20"
    And the previous country should be cleared
    And a CommunityIpAddressUpdatedEvent should be raised with the community id and ipAddress

  Scenario: Setting the same IP address again
    Given community settings with ipAddress "198.51.100.20"
    When I set the ipAddress to "198.51.100.20"
    Then no integration event should be raised

  Scenario: Setting the IP address without permission
    Given community settings without permission to manage community settings
    When I try to set the ipAddress to "198.51.100.20"
    Then a PermissionError should be thrown

  Scenario: Applying a geolocation as the system account
    Given community settings with a system passport
    When I apply a geolocation with countryCode "ca" and countryName "Canada"
    Then the settings should store countryCode "CA" and countryName "Canada"
    And a missing countryName should be stored as undefined

  Scenario: Applying a geolocation without the system account
    Given community settings with permission to manage community settings only
    When I try to apply a geolocation
    Then a PermissionError should be thrown
