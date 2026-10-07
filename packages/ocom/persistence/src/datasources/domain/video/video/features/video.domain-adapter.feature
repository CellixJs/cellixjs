Feature: Video Domain Adapter

  Background:
    Given a Mongoose Video document that is ready, with a populated community

  Scenario: Reading the stored fields
    Given a VideoDomainAdapter for the document
    Then the title, status, source, output, manifests, duration, rendition heights, and failure fields should match the document

  Scenario: Writing fields back to the document
    Given a VideoDomainAdapter for the document
    When I set every writable field to new values
    Then the document should hold the new values

  Scenario: Returning copies of rendition heights
    Given a VideoDomainAdapter for the document
    When I modify the array returned by renditionHeights
    Then the document's renditionHeights should be unchanged

  Scenario: Reading and replacing caption tracks
    Given a VideoDomainAdapter for the document
    Then captionTracks should be plain copies of the document's tracks
    When I set captionTracks to a Spanish track
    And the document should hold only the Spanish track

  Scenario: Reading missing optional fields as null
    Given a VideoDomainAdapter for a document without output, duration, or failure fields
    Then the optional fields should be null and renditionHeights should be empty

  Scenario: Getting the community when populated
    Given a VideoDomainAdapter for the document
    When I get the community property
    Then it should return a CommunityDomainAdapter for the populated community

  Scenario: Getting the community when only its id is loaded
    Given a VideoDomainAdapter for a document whose community is an ObjectId
    When I get the community property
    Then it should return a reference with only the community id

  Scenario: Getting the community when it is missing
    Given a VideoDomainAdapter for a document without a community
    When I get the community property
    Then an error should be thrown indicating "community is not populated"

  Scenario: Setting the community reference
    Given a VideoDomainAdapter for the document
    When I call setCommunityRef with a community reference
    Then the document's community should be set to an ObjectId with that id

  Scenario: Setting a community reference without an id
    Given a VideoDomainAdapter for the document
    When I call setCommunityRef with a reference that has no id
    Then an error should be thrown indicating "community reference is missing id"
