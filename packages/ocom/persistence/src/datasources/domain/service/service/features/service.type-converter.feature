Feature: Service Type Converter

  Background:
    Given a valid Mongoose Service document with serviceName "Test Service", description "Test service description", and populated community field

  Scenario: Converting a Mongoose Service document to a domain object
    Given a ServiceConverter instance
    When I call toDomain with the Mongoose Service document
    Then I should receive a Service domain object
    And the domain object's serviceName should be "Test Service"
    And the domain object's description should be "Test service description"

  Scenario: Converting a domain object to a Mongoose Service document
    Given a ServiceConverter instance
    And a Service domain object with serviceName "New Service", description "New description", and valid community
    When I call toPersistence with the Service domain object
    Then I should receive a Mongoose Service document
    And the document's serviceName should be "New Service"
    And the document's description should be "New description"