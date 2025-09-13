Feature: <AggregateRoot> Community

  Background:
    Given a valid Passport with community permissions
    And a valid EndUserEntityReference for "user1"
    And base community properties with name "Test Community", domain "test.com", whiteLabelDomain "wl.test.com", handle "testhandle", createdBy "user1", and valid timestamps

  Scenario: Creating a new community instance
    When I create a new Community aggregate using getNewInstance with name "New Community" and createdBy "user1"
    Then the community's name should be "New Community"
    And the community's createdBy should reference "user1"
    And a CommunityCreatedEvent should be emitted

  Scenario: Changing the name with permission to manage community settings
    Given a Community aggregate with permission to manage community settings
    When I set the name to "Updated Name"
    Then the community's name should be "Updated Name"

  Scenario: Changing the name without permission
    Given a Community aggregate without permission to manage community settings
    When I try to set the name to "Updated Name"
    Then a PermissionError should be thrown

  Scenario: Changing the name to an invalid value
    Given a Community aggregate with permission to manage community settings
    When I try to set the name to an invalid value (e.g., null or empty string)
    Then an error should be thrown indicating the value is invalid

  Scenario: Changing the domain with permission to manage community settings
    Given a Community aggregate with permission to manage community settings
    When I set the domain to "updated.com"
    Then the community's domain should be "updated.com"
    And a CommunityDomainUpdatedEvent should be emitted with the new and old domain

  Scenario: Changing the domain without permission
    Given a Community aggregate without permission to manage community settings
    When I try to set the domain to "updated.com"
    Then a PermissionError should be thrown
    And no CommunityDomainUpdatedEvent should be emitted

  Scenario: Changing the domain to an invalid value
    Given a Community aggregate with permission to manage community settings
    When I try to set the domain to an invalid value (e.g., null or empty string)
    Then an error should be thrown indicating the value is invalid
    And no CommunityDomainUpdatedEvent should be emitted

  Scenario: Changing the domain to the same value
    Given a Community aggregate with permission to manage community settings
    When I set the domain to its current value
    Then no CommunityDomainUpdatedEvent should be emitted
    And the community's domain should remain unchanged

  Scenario: Changing the white label domain with permission to manage community settings
    Given a Community aggregate with permission to manage community settings
    When I set the whiteLabelDomain to "newwl.com"
    Then the community's whiteLabelDomain should be "newwl.com"

  Scenario: Changing the white label domain without permission
    Given a Community aggregate without permission to manage community settings
    When I try to set the whiteLabelDomain to "newwl.com"
    Then a PermissionError should be thrown

  Scenario: Changing the white label domain to an invalid value
    Given a Community aggregate with permission to manage community settings
    When I try to set the whiteLabelDomain to an invalid value (e.g., undefined or empty string)
    Then an error should be thrown indicating the value is invalid

  Scenario: Changing the handle with permission to manage community settings
    Given a Community aggregate with permission to manage community settings
    When I set the handle to "newhandle"
    Then the community's handle should be "newhandle"

  Scenario: Changing the handle without permission
    Given a Community aggregate without permission to manage community settings
    When I try to set the handle to "newhandle"
    Then a PermissionError should be thrown

  Scenario: Changing the handle to an invalid value
    Given a Community aggregate with permission to manage community settings
    When I try to set the handle to an invalid value (e.g. undefined or empty string)
    Then an error should be thrown indicating the value is invalid

  Scenario: Getting createdAt, updatedAt, and schemaVersion
    Given a Community aggregate
    Then the createdAt property should return the correct date
    And the updatedAt property should return the correct date
    And the schemaVersion property should return the correct version
