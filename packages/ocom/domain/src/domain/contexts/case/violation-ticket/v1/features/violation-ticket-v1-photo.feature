Feature: <Entity> ViolationTicketV1Photo

  Scenario: Creating a new ViolationTicketV1Photo instance
    When I create a new ViolationTicketV1Photo with valid properties
    Then the instance should be created successfully
    And the document ID should be set correctly
    And the description should be set correctly

  Scenario: Setting document ID with proper permissions
    When I have a ViolationTicketV1Photo instance
    And I have proper permissions to modify
    And I set the document ID
    Then the document ID should be updated

  Scenario: Setting document ID without permissions
    When I have a ViolationTicketV1Photo instance
    And I do not have proper permissions to modify
    And I set the document ID
    Then a PermissionError should be thrown

  Scenario: Setting description with proper permissions
    When I have a ViolationTicketV1Photo instance
    And I have proper permissions to modify
    And I set the description
    Then the description should be updated

  Scenario: Setting description without permissions
    When I have a ViolationTicketV1Photo instance
    And I do not have proper permissions to modify
    And I set the description
    Then a PermissionError should be thrown

  Scenario: Getting new document ID
    When I have a ViolationTicketV1Photo instance
    And I call getNewDocumentId
    Then it should return a new document ID

  Scenario: Getting new document ID generates unique values
    When I call getNewDocumentId multiple times
    Then each result should be unique
    And each should match the expected format