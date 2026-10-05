Feature: Video read repository factory

  Scenario: Building the video read repository
    When I call VideoReadRepositoryImpl with models and a passport
    Then it should expose a VideoReadRepo with getById and getByCommunityId
