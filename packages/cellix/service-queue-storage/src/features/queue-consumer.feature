Feature: Queue Consumer
  As a consumer of @cellix/service-queue-storage
  I want to receive typed messages from registered inbound queues

  Scenario: Successfully receiving messages from an inbound queue
    Given a queue registry with a "importRequests" inbound queue
    And a service instance is created from the registry
    When I call receiveFromImportRequestsQueue
    Then a single typed message is returned
