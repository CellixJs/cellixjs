Feature: <TypeConverter> CommunityConverter

  Background:
    Given a valid Mongoose Community document with name "Test Community", domain "test.com", whiteLabelDomain "white.test.com", handle "test-handle", and a populated createdBy field

  Scenario: Converting a Mongoose Community document to a domain object
    Given a CommunityConverter instance
    When I call toDomain with the Mongoose Community document
    Then I should receive a Community domain object
    And the domain object's name should be "Test Community"
    And the domain object's domain should be "test.com"
    And the domain object's whiteLabelDomain should be "white.test.com"
    And the domain object's handle should be "test-handle"
    And the domain object's createdBy should be an EndUser domain object with the correct user data

  Scenario: Converting a domain object to a Mongoose Community document
    Given a CommunityConverter instance
    And a Community domain object with name "New Community", domain "new.com", whiteLabelDomain "newwhite.com", handle "new-handle", and a valid createdBy
    When I call toPersistence with the Community domain object
    Then I should receive a Mongoose Community document
    And the document's name should be "New Community"
    And the document's domain should be "new.com"
    And the document's whiteLabelDomain should be "newwhite.com"
    And the document's handle should be "new-handle"
    And the document's createdBy should be set to the correct user document
