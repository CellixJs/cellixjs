Feature: ServiceTicketV1Message Entity

  Scenario: Creating a new ServiceTicketV1Message instance
    When I create a new ServiceTicketV1Message with valid properties
    Then the instance should be created successfully
    And the sentBy should be "internal"
    And the message should be "Test message"
    And the embedding should be "test-embedding"
    And the isHiddenFromApplicant should be false

  Scenario: Setting sentBy with proper permissions
    When I have a ServiceTicketV1Message instance
    And I have proper permissions to modify messages
    And I set the sentBy to "external"
    Then the sentBy should be updated to "external"

  Scenario: Setting sentBy without permissions
    When I have a ServiceTicketV1Message instance
    And I do not have proper permissions to modify messages
    And I set the sentBy to "external"
    Then a PermissionError should be thrown

  Scenario: Setting message with proper permissions
    When I have a ServiceTicketV1Message instance
    And I have proper permissions to modify messages
    And I set the message to "Updated message"
    Then the message should be updated to "Updated message"

  Scenario: Setting message without permissions
    When I have a ServiceTicketV1Message instance
    And I do not have proper permissions to modify messages
    And I set the message to "Updated message"
    Then a PermissionError should be thrown

  Scenario: Setting embedding with proper permissions
    When I have a ServiceTicketV1Message instance
    And I have proper permissions to modify messages
    And I set the embedding to "updated-embedding"
    Then the embedding should be updated to "updated-embedding"

  Scenario: Setting embedding without permissions
    When I have a ServiceTicketV1Message instance
    And I do not have proper permissions to modify messages
    And I set the embedding to "updated-embedding"
    Then a PermissionError should be thrown

  Scenario: Setting createdAt with system account permissions
    When I have a ServiceTicketV1Message instance
    And I have system account permissions
    And I set the createdAt to a new date
    Then the createdAt should be updated

  Scenario: Setting createdAt without system account permissions
    When I have a ServiceTicketV1Message instance
    And I do not have system account permissions
    And I set the createdAt to a new date
    Then a PermissionError should be thrown

  Scenario: Setting isHiddenFromApplicant with proper permissions
    When I have a ServiceTicketV1Message instance
    And I have proper permissions to modify messages
    And I set the isHiddenFromApplicant to true
    Then the isHiddenFromApplicant should be true

  Scenario: Setting isHiddenFromApplicant without permissions
    When I have a ServiceTicketV1Message instance
    And I do not have proper permissions to modify messages
    And I set the isHiddenFromApplicant to true
    Then a PermissionError should be thrown