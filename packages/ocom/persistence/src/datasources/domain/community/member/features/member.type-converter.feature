Feature: <TypeConverter> MemberConverter

  Background:
    Given a valid Mongoose Member document with memberName "Test Member", cybersourceCustomerId "test-customer-id", populated community, role, and profile fields

  Scenario: Converting a Mongoose Member document to a domain object
    Given a MemberConverter instance
    When I call toDomain with the Mongoose Member document
    Then I should receive a Member domain object
    And the domain object's memberName should be "Test Member"
    And the domain object's cybersourceCustomerId should be "test-customer-id"
    And the domain object's community should be a Community domain object
    And the domain object's role should be an EndUserRole domain object
    And the domain object's profile should be a MemberProfile domain object

  Scenario: Converting a domain object to a Mongoose Member document
    Given a MemberConverter instance
    And a Member domain object with memberName "New Member", cybersourceCustomerId "new-customer-id", and valid community, role, and profile
    When I call toPersistence with the Member domain object
    Then I should receive a Mongoose Member document
    And the document's memberName should be "New Member"
    And the document's cybersourceCustomerId should be "new-customer-id"
    And the document's community should be set to the correct community document
    And the document's role should be set to the correct role document
    And the document's profile should be set to the correct profile document