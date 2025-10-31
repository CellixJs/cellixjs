Feature: <AggregateRoot> Service

  Background:
    Given a valid Passport with service permissions
    And a valid CommunityEntityReference
    And base service properties with serviceName "Test Service", description "A test service", isActive true, a valid community, and valid timestamps

  Scenario: Creating a new service instance
    When I create a new Service aggregate using getNewInstance with serviceName "New Service", description "A new service", and a CommunityEntityReference
    Then the service's serviceName should be "New Service"
    And the service's description should be "A new service"
    And the service's community should reference the provided CommunityEntityReference
    And the service's isActive should be true

  Scenario: Changing the serviceName with permission to manage services
    Given a Service aggregate with permission to manage services
    When I set the serviceName to "Updated Service"
    Then the service's serviceName should be "Updated Service"

  Scenario: Changing the serviceName without permission
    Given a Service aggregate without permission to manage services
    When I try to set the serviceName to "Updated Service"
    Then a PermissionError should be thrown

  Scenario: Changing the serviceName to an invalid value
    Given a Service aggregate with permission to manage services
    When I try to set the serviceName to an invalid value (e.g., null or empty string)
    Then an error should be thrown indicating the value is invalid

  Scenario: Changing the description with permission to manage services
    Given a Service aggregate with permission to manage services
    When I set the description to "Updated description"
    Then the service's description should be "Updated description"

  Scenario: Changing the description without permission
    Given a Service aggregate without permission to manage services
    When I try to set the description to "Updated description"
    Then a PermissionError should be thrown

  Scenario: Changing the description to an invalid value
    Given a Service aggregate with permission to manage services
    When I try to set the description to an invalid value (e.g., null or empty string)
    Then an error should be thrown indicating the value is invalid

  Scenario: Changing isActive with permission to manage services
    Given a Service aggregate with permission to manage services
    When I set isActive to false
    Then the service's isActive should be false

  Scenario: Changing isActive without permission
    Given a Service aggregate without permission to manage services
    When I try to set isActive to false
    Then a PermissionError should be thrown

  Scenario: Getting createdAt, updatedAt, and schemaVersion
    Given a Service aggregate
    Then the createdAt property should return the correct date
    And the updatedAt property should return the correct date
    And the schemaVersion property should return the correct version
