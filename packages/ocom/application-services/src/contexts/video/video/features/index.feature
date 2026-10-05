Feature: Video Application Service

  Scenario: Building the video application service
    When I build the Video application service
    Then it should expose requestUpload, completeUpload, queryByCommunity, queryById, and getPlayback

  Scenario: Querying videos
    Given the read repository returns videos
    When I query videos by community and by id
    Then the read repository should be asked for that community and that id
