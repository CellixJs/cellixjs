Feature: Register Queues
  As a package consumer
  I want registerQueues to provide typed stubs and a bound Service class

  Scenario: Registry provides stubbed producer and consumer methods
    Given a queue registry with outbound and inbound queues
    Then the producer contains stub sendMessageTo<QueueName>Queue methods
    And the producer contains stub peekAt<QueueName>Queue methods
    And the consumer contains stub receiveFrom<QueueName>Queue and peekAt<QueueName>Queue methods

  Scenario: Service created from the registry has typed queue methods
    Given a queue registry with an "emailNotifications" outbound queue
    When a service instance is created from the registry
    Then the service exposes sendMessageToEmailNotificationsQueue
