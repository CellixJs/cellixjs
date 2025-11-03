Feature: Service Repository

  Background:
    Given a ServiceRepository instance with a mock model and converter

  Scenario: Getting a service by ID when the service exists
    Given a service document exists in the database with ID "123"
    When I call getById with ID "123"
    Then it should return a Service domain object
    And the model's findById method should have been called with "123"

  Scenario: Getting a service by ID when the service does not exist
    Given no service document exists in the database with ID "999"
    When I call getById with "999"
    Then an error should be thrown indicating "Service with id 999 not found"

  Scenario: Getting a new service instance
    Given a valid community reference
    When I call getNewInstance with service name "New Service", description "New description", and community reference
    Then it should return a new Service domain object