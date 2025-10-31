Feature: <TypeConverter> PropertyConverter

  Background:
    Given a valid Mongoose Property document with propertyName "Test Property", propertyType "house", and populated community and owner fields

  Scenario: Converting a Mongoose Property document to a domain object
    Given a PropertyConverter instance
    When I call toDomain with the Mongoose Property document
    Then I should receive a Property domain object
    And the domain object's propertyName should be "Test Property"
    And the domain object's propertyType should be "house"

  Scenario: Converting a domain object to a Mongoose Property document
    Given a PropertyConverter instance
    And a Property domain object with propertyName "New Property", propertyType "apartment", and valid community and owner
    When I call toPersistence with the Property domain object
    Then I should receive a Mongoose Property document
    And the document's propertyName should be "New Property"
    And the document's propertyType should be "apartment"