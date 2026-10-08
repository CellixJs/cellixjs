Feature: VideoViewingDomainAdapter

  Scenario: Reading the stored fields
    Given a VideoViewingDomainAdapter for a stored viewing
    Then the references should be read as id strings
    And the buckets, counts, credit, positions, and dates should be read as stored

  Scenario: Reading a new document without values
    Given a VideoViewingDomainAdapter for a new document
    Then the references should be empty strings
    And there should be no watched buckets, credit, positions, or report and completion dates

  Scenario: Writing the fields
    Given a VideoViewingDomainAdapter for a new document
    When I set the references, buckets, counts, credit, positions, and dates
    Then the document should hold ObjectId references and the new values

  Scenario: Converting a stored viewing to the domain
    Given a stored viewing and a passport
    When I call toDomain on the VideoViewingConverter
    Then I should receive a VideoViewing with the stored coverage
