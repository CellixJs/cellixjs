Feature: Video Unit of Work

  Scenario: Creating a unit of work for videos
    Given a Video model and a passport
    When I call getVideoUnitOfWork
    Then it should return a unit of work with transaction methods
