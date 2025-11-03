Feature: Violation Ticket V1 Finance Details Transactions Submission

  Scenario: Creating a new ViolationTicketV1FinanceDetailsTransactionsSubmission instance
    When I create a new ViolationTicketV1FinanceDetailsTransactionsSubmission with valid properties
    Then the amount should be accessible
    And the transaction reference should be accessible

  Scenario: Setting amount
    Given I have a ViolationTicketV1FinanceDetailsTransactionsSubmission instance
    When I set the amount to 200.75
    Then the amount should be 200.75