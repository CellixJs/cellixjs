Feature: Violation Ticket V1 Finance Details Adhoc Transactions Transaction Reference

  Scenario: Creating a new ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReference instance
    When I create a new ViolationTicketV1FinanceDetailsAdhocTransactionsTransactionReference with valid properties
    Then the reference ID should be accessible
    And the completed on date should be accessible
    And the vendor should be accessible