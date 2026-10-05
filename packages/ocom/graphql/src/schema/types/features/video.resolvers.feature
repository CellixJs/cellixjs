Feature: Video Resolvers

  Background:
    Given a signed-in member whose request is scoped to community "community-1"

  Scenario: Listing the current community's videos
    When I query communityVideos
    Then the videos for community "community-1" should be returned

  Scenario: Rejecting requests without a community scope
    Given a signed-in user whose request has no community scope
    When I query communityVideos
    Then an "Unauthorized" error should be thrown

  Scenario: Getting a video in the current community
    Given video "video-1" belongs to community "community-1"
    When I query videoById for "video-1"
    Then video "video-1" should be returned

  Scenario: Hiding a video from another community
    Given video "video-9" belongs to community "community-2"
    When I query videoById for "video-9"
    Then null should be returned

  Scenario: Getting playback for a video in the current community
    Given video "video-1" belongs to community "community-1"
    When I query videoPlayback for "video-1"
    Then the playback URLs and token should be returned

  Scenario: Refusing playback for a video from another community
    Given video "video-9" belongs to community "community-2"
    When I query videoPlayback for "video-9"
    Then null should be returned
    And no playback should be requested

  Scenario: Requesting an upload
    When I request an upload titled "Board meeting" for a 1024-byte "video/mp4" file
    Then the upload should be requested for community "community-1"
    And the result should succeed with the video and the upload headers as name and value pairs

  Scenario: Reporting a failed upload request
    Given requesting an upload fails with "You do not have permission to upload videos"
    When I request an upload titled "Board meeting" for a 1024-byte "video/mp4" file
    Then the result should fail with "You do not have permission to upload videos"

  Scenario: Completing an upload in the current community
    Given video "video-1" belongs to community "community-1"
    When I complete the upload for "video-1"
    Then the result should succeed with the uploaded video

  Scenario: Refusing to complete an upload from another community
    Given video "video-9" belongs to community "community-2"
    When I complete the upload for "video-9"
    Then the result should fail with "Video not found"
    And no upload should be completed
