Feature: Video Viewing Persistence

  Scenario: Building the video viewing persistence layer
    Given a models context with a VideoViewing model and a passport
    When I call VideoViewingPersistence
    Then it should expose a VideoViewingUnitOfWork
