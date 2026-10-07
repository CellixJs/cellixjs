Feature: VideoViewingReadRepository

  Background:
    Given a VideoViewingReadRepository backed by a mock data source

  Scenario: Getting a member's viewing of a video
    Given the member has a viewing of the video
    When I call getByVideoAndMember
    Then I should receive a VideoViewing for that member
    And the data source should have been queried by video and member

  Scenario: Getting a viewing that does not exist
    Given the member has no viewing of the video
    When I call getByVideoAndMember
    Then I should receive null

  Scenario: Listing a video's viewings, most recently updated first
    Given two members have viewings of the video
    When I call getByVideoId
    Then I should receive both viewings
    And the data source should have been queried by video, sorted by updatedAt descending
