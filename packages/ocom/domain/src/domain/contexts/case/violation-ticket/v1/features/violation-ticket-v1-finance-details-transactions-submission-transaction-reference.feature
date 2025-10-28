Feature: Violation Ticket V1 Finance Details Transactions Submission Transaction Reference

  Scenario: Creating a new ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReference instance
    When I create a new ViolationTicketV1FinanceDetailsTransactionsSubmissionTransactionReference with valid properties
    Then the reference ID should be accessible
    And the completed on date should be accessible
    And the vendor should be accessible