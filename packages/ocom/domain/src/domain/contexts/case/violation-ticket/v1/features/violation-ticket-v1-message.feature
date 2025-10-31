Feature: <Entity> ViolationTicketV1Message

  Scenario: Creating a new ViolationTicketV1Message instance
    When I create a new ViolationTicketV1Message with valid properties
    Then the instance should be created successfully
    And the sent by should be set correctly
    And the message should be set correctly
    And the embedding should be set correctly
    And the created at should be set to current date
    And is hidden from applicant should be false

  Scenario: Setting sent by with proper permissions
    When I have a ViolationTicketV1Message instance
    And I have proper permissions to modify
    And I set the sent by
    Then the sent by should be updated

  Scenario: Setting sent by without permissions
    When I have a ViolationTicketV1Message instance
    And I do not have proper permissions to modify
    And I set the sent by
    Then a PermissionError should be thrown

  Scenario: Setting message with proper permissions
    When I have a ViolationTicketV1Message instance
    And I have proper permissions to modify
    And I set the message
    Then the message should be updated

  Scenario: Setting message without permissions
    When I have a ViolationTicketV1Message instance
    And I do not have proper permissions to modify
    And I set the message
    Then a PermissionError should be thrown

  Scenario: Setting embedding with proper permissions
    When I have a ViolationTicketV1Message instance
    And I have proper permissions to modify
    And I set the embedding
    Then the embedding should be updated

  Scenario: Setting is hidden from applicant with proper permissions
    When I have a ViolationTicketV1Message instance
    And I have proper permissions to modify
    And I set is hidden from applicant
    Then the visibility should be updated

  Scenario: Loading initiated by reference
    When I have a ViolationTicketV1Message instance
    And I call loadInitiatedBy
    Then it should return the member entity reference