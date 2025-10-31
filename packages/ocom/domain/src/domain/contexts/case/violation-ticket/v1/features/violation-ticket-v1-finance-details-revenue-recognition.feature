Feature: <Entity> ViolationTicketV1FinanceDetailsRevenueRecognition

  Scenario: Creating a new ViolationTicketV1FinanceDetailsRevenueRecognition instance
    When I create a new ViolationTicketV1FinanceDetailsRevenueRecognition with valid properties
    Then the instance should be created successfully
    And the submission should be set correctly
    And the recognition should be set correctly