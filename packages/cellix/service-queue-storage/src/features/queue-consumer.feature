Feature: Queue Consumer
  As a consumer of @cellix/service-queue-storage
  I want to receive typed messages from registered inbound queues

  Scenario: Successfully receiving messages from an inbound queue
    Given a queue registry with a "importRequests" inbound queue
    And a service instance is created from the registry
    When I call receiveFromImportRequestsQueue
    Then a single typed message is returned

  Scenario: Processing a trigger-delivered inbound queue message
    Given a queue registry with a "importRequests" inbound queue
    And a service instance is created from the registry
    When I call receiveFromImportRequestsQueue with a trigger-delivered message
    Then the trigger-delivered message is validated and returned as a typed message
