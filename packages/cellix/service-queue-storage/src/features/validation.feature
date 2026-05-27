Feature: Validation
  As a consumer of @cellix/service-queue-storage
  I want incoming and outgoing message payloads to be validated against schemas

  Scenario: Invalid outbound payload is rejected
    Given a queue registry with a "emailNotifications" outbound queue
    And the registry is bound to a running queue storage service
    When I call sendMessageToEmailNotificationsQueue with an invalid payload
    Then a validation error is thrown
