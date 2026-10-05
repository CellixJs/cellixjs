Feature: Video Type Converter

  Scenario: Converting a Mongoose Video document to a domain object
    Given a Mongoose Video document and a passport
    When I call toDomain on the VideoConverter
    Then I should receive a Video domain object with the document's title and status

  Scenario: Converting a domain object back to a Mongoose document
    Given a Video domain object created from a document
    When I call toPersistence on the VideoConverter
    Then I should receive the original Mongoose document
