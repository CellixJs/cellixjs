Feature: Service Domain Adapter

  Background:
    Given a valid Mongoose Service document with serviceName "Test Service", description "Test service description", and populated community field

  Scenario: Getting and setting the serviceName property
    Given a ServiceDomainAdapter for the document
    When I get the serviceName property
    Then it should return "Test Service"
    When I set the serviceName property to "Updated Service"
    Then the document's serviceName should be "Updated Service"

  Scenario: Getting and setting the description property
    Given a ServiceDomainAdapter for the document
    When I get the description property
    Then it should return "Test service description"
    When I set the description property to "Updated description"
    Then the document's description should be "Updated description"

  Scenario: Getting and setting the isActive property
    Given a ServiceDomainAdapter for the document
    When I get the isActive property
    Then it should return true
    When I set the isActive property to false
    Then the document's isActive should be false

  Scenario: Getting the community property when populated
    Given a ServiceDomainAdapter for the document
    When I get the community property
    Then it should return a CommunityDomainAdapter instance with the correct community data

  Scenario: Getting the community property when not populated
    Given a ServiceDomainAdapter for a document with community as an ObjectId
    When I get the community property
    Then an error should be thrown indicating "community is not populated"

  Scenario: Loading the community
    Given a ServiceDomainAdapter for a document with community as an ObjectId
    When I load the community
    Then it should populate and return the community

  Scenario: Setting the community property with a valid Community domain object
    Given a ServiceDomainAdapter for the document
    And a valid Community domain object
    When I set the community property to the Community domain object
    Then the document's community should be set to the community's id as ObjectId

  Scenario: Setting the community property with an invalid value
    Given a ServiceDomainAdapter for the document
    And an object that is not a Community domain object
    When I try to set the community property to the invalid object
    Then an error should be thrown indicating "community reference is missing id"

  Scenario: Getting the createdAt property
    Given a ServiceDomainAdapter for the document
    When I get the createdAt property
    Then it should return the createdAt date

  Scenario: Getting the updatedAt property
    Given a ServiceDomainAdapter for the document
    When I get the updatedAt property
    Then it should return the updatedAt date