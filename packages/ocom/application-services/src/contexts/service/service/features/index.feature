Feature: Service Application Service

  Scenario: Creating a service through the application service
    Given a service application service
    When I create a service with name "Test Service"
    Then it should delegate to the create function