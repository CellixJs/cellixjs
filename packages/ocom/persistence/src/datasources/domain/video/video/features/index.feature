Feature: Video Persistence

  Scenario: Building the video persistence layer
    Given a models context with a Video model and a passport
    When I call VideoPersistence
    Then it should expose a VideoUnitOfWork
