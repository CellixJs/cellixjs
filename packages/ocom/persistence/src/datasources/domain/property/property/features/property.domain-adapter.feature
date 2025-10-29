Feature: <DomainAdapter> PropertyDomainAdapter

  Background:
    Given a valid Mongoose Property document with propertyName "Test Property", propertyType "house", and populated community and owner fields

  Scenario: Getting and setting the propertyName property
    Given a PropertyDomainAdapter for the document
    When I get the propertyName property
    Then it should return "Test Property"
    When I set the propertyName property to "Updated Property"
    Then the document's propertyName should be "Updated Property"

  Scenario: Getting and setting the propertyType property
    Given a PropertyDomainAdapter for the document
    When I get the propertyType property
    Then it should return "house"
    When I set the propertyType property to "apartment"
    Then the document's propertyType should be "apartment"

  Scenario: Getting and setting the listedForSale property
    Given a PropertyDomainAdapter for the document
    When I get the listedForSale property
    Then it should return true
    When I set the listedForSale property to false
    Then the document's listedForSale should be false

  Scenario: Getting and setting the listedForRent property
    Given a PropertyDomainAdapter for the document
    When I get the listedForRent property
    Then it should return false
    When I set the listedForRent property to true
    Then the document's listedForRent should be true

  Scenario: Getting and setting the listedForLease property
    Given a PropertyDomainAdapter for the document
    When I get the listedForLease property
    Then it should return false
    When I set the listedForLease property to true
    Then the document's listedForLease should be true

  Scenario: Getting and setting the listedInDirectory property
    Given a PropertyDomainAdapter for the document
    When I get the listedInDirectory property
    Then it should return true
    When I set the listedInDirectory property to false
    Then the document's listedInDirectory should be false

  Scenario: Getting and setting the tags property
    Given a PropertyDomainAdapter for the document
    When I get the tags property
    Then it should return ["tag1", "tag2"]
    When I set the tags property to ["newTag1", "newTag2"]
    Then the document's tags should be ["newTag1", "newTag2"]

  Scenario: Getting the communityId property
    Given a PropertyDomainAdapter for the document
    When I get the communityId property
    Then it should return the community's id as a string

  Scenario: Getting the community property when populated
    Given a PropertyDomainAdapter for the document
    When I get the community property
    Then it should return a CommunityDomainAdapter instance with the correct community data

  Scenario: Getting the community property when not populated
    Given a PropertyDomainAdapter for a document with community as an ObjectId
    When I get the community property
    Then an error should be thrown indicating "community is not populated or is not of the correct type"

  Scenario: Setting the community property with a valid Community domain object
    Given a PropertyDomainAdapter for the document
    And a valid Community domain object
    When I set the community property to the Community domain object
    Then the document's community should be set to the community's doc

  Scenario: Setting the community property with an invalid value
    Given a PropertyDomainAdapter for the document
    And an object that is not a Community domain object
    When I try to set the community property to the invalid object
    Then an error should be thrown indicating "community reference is missing id"

  Scenario: Getting the ownerId property
    Given a PropertyDomainAdapter for the document
    When I get the ownerId property
    Then it should return the owner's id as a string

  Scenario: Getting the owner property when populated
    Given a PropertyDomainAdapter for the document
    When I get the owner property
    Then it should return a MemberEntityReference instance

  Scenario: Getting the owner property when not populated
    Given a PropertyDomainAdapter for a document with owner as an ObjectId
    When I get the owner property
    Then an error should be thrown indicating "owner is not populated or is not of the correct type"

  Scenario: Setting the owner property with a valid Member domain object
    Given a PropertyDomainAdapter for the document
    And a valid Member domain object
    When I set the owner property to the Member domain object
    Then the document's owner should be set to the member's doc

  Scenario: Setting the owner property with an invalid value
    Given a PropertyDomainAdapter for the document
    And an object that is not a Member domain object
    When I try to set the owner property to the invalid object
    Then an error should be thrown indicating "owner reference is missing id"