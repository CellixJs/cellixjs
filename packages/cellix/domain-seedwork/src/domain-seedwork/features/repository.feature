Feature: Repository

  Scenario: Throwing a NotFoundError
    When a not found error is thrown with a message
    Then it should be an instance of Error with the correct name and message