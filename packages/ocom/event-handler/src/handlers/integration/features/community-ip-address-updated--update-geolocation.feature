Feature: CommunityIpAddressUpdated integration event handler

  Scenario: Storing the resolved geolocation on the community settings
    Given a community whose settings ipAddress is "198.51.100.20"
    And a geolocation service that resolves "198.51.100.20" to Canada
    When a CommunityIpAddressUpdatedEvent for that community and ipAddress is handled
    Then the community settings should receive the geolocation from the provider
    And the community should be saved

  Scenario: Ignoring a stale event
    Given a community whose settings ipAddress is "203.0.113.10"
    And a geolocation service that resolves "198.51.100.20" to Canada
    When a CommunityIpAddressUpdatedEvent for that community and ipAddress "198.51.100.20" is handled
    Then the community should not be saved

  Scenario: Geolocation not configured
    Given no geolocation service
    When a CommunityIpAddressUpdatedEvent is handled
    Then no unit of work should be started

  Scenario: Provider failure
    Given a geolocation service that fails
    When a CommunityIpAddressUpdatedEvent is handled
    Then the error should be logged and not thrown
