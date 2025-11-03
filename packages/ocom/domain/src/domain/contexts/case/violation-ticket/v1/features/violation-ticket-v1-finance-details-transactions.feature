Feature: <Entity> ViolationTicketV1FinanceDetailsTransactions

  Scenario: Creating a new ViolationTicketV1FinanceDetailsTransactions instance
    When I create a new ViolationTicketV1FinanceDetailsTransactions with valid properties
    Then the instance should be created successfully
    And the submission should be set correctly
    And the adhoc transactions should be accessible

  Scenario: Requesting to add new adhoc transaction
    When I have a ViolationTicketV1FinanceDetailsTransactions instance
    And I request to add a new adhoc transaction
    Then a new adhoc transaction should be returned