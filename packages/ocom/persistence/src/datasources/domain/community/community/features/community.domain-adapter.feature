Feature: <DomainAdapter> CommunityDomainAdapter

  Background:
    Given a valid Mongoose Community document with name "Test Community", domain "test.com", whiteLabelDomain "white.test.com", handle "test-handle", and a populated createdBy field

  Scenario: Getting and setting the name property
    Given a CommunityDomainAdapter for the document
    When I get the name property
    Then it should return "Test Community"
    When I set the name property to "New Name"
    Then the document's name should be "New Name"

  Scenario: Getting and setting the domain property
    Given a CommunityDomainAdapter for the document
    When I get the domain property
    Then it should return "test.com"
    When I set the domain property to "new.com"
    Then the document's domain should be "new.com"

  Scenario: Getting and setting the whiteLabelDomain property
    Given a CommunityDomainAdapter for the document
    When I get the whiteLabelDomain property
    Then it should return "white.test.com"
    When I set the whiteLabelDomain property to "newwhite.com"
    Then the document's whiteLabelDomain should be "newwhite.com"

  Scenario: Getting and setting the handle property
    Given a CommunityDomainAdapter for the document
    When I get the handle property
    Then it should return "test-handle"
    When I set the handle property to "new-handle"
    Then the document's handle should be "new-handle"

  Scenario: Getting the createdBy property when populated
    Given a CommunityDomainAdapter for the document
    When I get the createdBy property
    Then it should return an EndUserDomainAdapter instance with the correct user data

  Scenario: Getting the createdBy property when not populated
    Given a CommunityDomainAdapter for a document with no createdBy
    When I get the createdBy property
    Then an error should be thrown indicating "createdBy is not populated"

  Scenario: Getting the createdBy property when it is an ObjectId
    Given a CommunityDomainAdapter for a document with createdBy as an ObjectId
    When I get the createdBy property
    Then an error should be thrown indicating "createdBy is not populated or is not of the correct type"

  Scenario: Setting the createdBy property with a valid EndUserDomainAdapter
    Given a CommunityDomainAdapter for the document
    And a valid EndUserDomainAdapter instance
    When I set the createdBy property to the EndUserDomainAdapter
    Then the document's createdBy should be set to the user's doc

  Scenario: Setting the createdBy property with an invalid value
    Given a CommunityDomainAdapter for the document
    And an object that is not an EndUserDomainAdapter
    When I try to set the createdBy property to the invalid object
    Then an error should be thrown indicating "user is not an instance of EndUserDomainAdapter"
