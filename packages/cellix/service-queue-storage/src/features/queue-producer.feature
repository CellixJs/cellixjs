Feature: Queue Producer
  As a consumer of @cellix/service-queue-storage
  I want to send typed messages to registered outbound queues

  Scenario: Successfully sending a valid message to an outbound queue
    Given a queue registry with a "emailNotifications" outbound queue
    And a service instance is created from the registry
    When I call sendMessageToEmailNotificationsQueue with a valid payload
    Then the message is sent to the "email-notifications" queue

  Scenario: Sending an invalid payload is rejected with a validation error
    Given a queue registry with a "emailNotifications" outbound queue
    And a service instance is created from the registry
    When I call sendMessageToEmailNotificationsQueue with an invalid payload
    Then a validation error is thrown describing the schema violation

  Scenario: Peeking at messages in an outbound queue
    Given a queue registry with a "emailNotifications" outbound queue
    And a service instance is created from the registry
    When I call peekAtEmailNotificationsQueue
    Then a list of typed messages is returned

