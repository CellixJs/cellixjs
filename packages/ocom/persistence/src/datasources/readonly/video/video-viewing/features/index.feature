Feature: Video Viewing Read Repository Index

  Scenario: Building the video viewing read repository
    When I call VideoViewingReadRepositoryImpl with models and a passport
    Then it should expose a VideoViewingReadRepo with getByVideoAndMember and getByVideoId
