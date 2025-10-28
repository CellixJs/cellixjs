Feature: <Entity> ViolationTicketV1FinanceDetailsAdhocTransactions

  Scenario: Creating a new ViolationTicketV1FinanceDetailsAdhocTransactions instance
    When I create a new ViolationTicketV1FinanceDetailsAdhocTransactions with valid properties
    Then the instance should be created successfully
    And the amount should be set correctly
    And the requested by should be set correctly
    And the requested on should be set correctly
    And the reason should be set correctly
    And the approval should be set correctly
    And the transaction reference should be set correctly
    And the finance reference should be set correctly
    And the created at should be set correctly
    And the updated at should be set correctly

  Scenario: Setting amount with proper permissions
    When I have a ViolationTicketV1FinanceDetailsAdhocTransactions instance
    And I have proper permissions to modify
    And I set the amount
    Then the amount should be updated

  Scenario: Setting amount without permissions
    When I have a ViolationTicketV1FinanceDetailsAdhocTransactions instance
    And I do not have proper permissions to modify
    And I set the amount
    Then a PermissionError should be thrown

  Scenario: Setting requested by with proper permissions
    When I have a ViolationTicketV1FinanceDetailsAdhocTransactions instance
    And I have proper permissions to modify
    And I set the requested by
    Then the requested by should be updated

  Scenario: Setting requested on with proper permissions
    When I have a ViolationTicketV1FinanceDetailsAdhocTransactions instance
    And I have proper permissions to modify
    And I set the requested on
    Then the requested on should be updated

  Scenario: Setting reason with proper permissions
    When I have a ViolationTicketV1FinanceDetailsAdhocTransactions instance
    And I have proper permissions to modify
    And I set the reason
    Then the reason should be updated