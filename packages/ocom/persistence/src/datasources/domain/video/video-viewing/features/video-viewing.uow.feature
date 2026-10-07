Feature: Video Viewing Unit of Work

  Scenario: Creating a unit of work for video viewings
    Given a VideoViewing model and a passport
    When I call getVideoViewingUnitOfWork
    Then it should return a unit of work with transaction methods
