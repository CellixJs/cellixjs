Feature: Video Get Playback Application Service

  Scenario: Getting playback for a ready video
    Given a ready video whose output is in "videos-c0ffee000000000000000001"
    When I get playback for the video
    Then I should receive both manifest URLs and a container read token
    And the token should be for the video's output container and expire in 2 hours

  Scenario: Getting playback for a ready video with captions
    Given a ready video with English captions in its output container and a stray track in another container
    When I get playback for the video
    Then I should receive a URL for the English captions only

  Scenario: Getting playback for a video that does not exist
    Given no video exists
    When I try to get playback for the video
    Then it should fail with "Video not found"

  Scenario: Getting playback when the domain refuses
    Given a video whose playback the domain refuses with "Video video-1 is not ready to play"
    When I try to get playback for the video
    Then it should fail with "Video video-1 is not ready to play"
    And no token should be issued
