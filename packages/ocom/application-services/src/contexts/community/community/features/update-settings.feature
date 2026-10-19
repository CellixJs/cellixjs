Feature: Update community settings

  Scenario: Updating settings with a client IP
    Given an existing community "community-1"
    When I update the settings for "community-1" with name "Renamed" and client IP "198.51.100.20"
    Then the community name should be "Renamed"
    And the community settings ipAddress should be set to "198.51.100.20"
    And the community should be saved

  Scenario: Updating settings without a client IP
    Given an existing community "community-1"
    When I update the settings for "community-1" with name "Renamed" and no client IP
    Then the community settings ipAddress should not be set

  Scenario: Updating a community that does not exist
    Given no community "missing"
    When I update the settings for "missing"
    Then an error should be thrown indicating the community was not found
