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

  Scenario: Resolving a video's community fields
    Given a video whose community "community-1" is named "Maple Grove"
    When I resolve the video's communityId and communityName
    Then they should be "community-1" and "Maple Grove"

  Scenario: Listing videos awaiting encoding as staff
    Given a signed-in staff user with no community scope
    When I query videosAwaitingEncoding
    Then the videos the caller can encode should be returned

  Scenario: Starting to encode as staff
    Given a signed-in staff user with no community scope
    When I start encoding "video-1"
    Then the result should succeed with the video and the encoding start details

  Scenario: Requesting output upload links as staff
    Given a signed-in staff user with no community scope
    When I request output upload links for "manifest.mpd"
    Then the result should succeed with one upload link per path

  Scenario: Recording a successful encode as staff
    Given a signed-in staff user with no community scope
    When I record a successful encode for "video-1"
    Then the success should be recorded and the result should succeed

  Scenario: Recording an encode result with both success and failure
    Given a signed-in staff user with no community scope
    When I record an encode result for "video-1" with both succeeded and failed
    Then the result should fail with "Provide exactly one of succeeded or failed"
    And nothing should be recorded

  Scenario: Rejecting staff operations without a signed-in user
    Given no signed-in user
    When I start encoding "video-1"
    Then the result should fail with "Unauthorized"

  Scenario: Refusing to complete an upload from another community
    Given video "video-9" belongs to community "community-2"
    When I complete the upload for "video-9"
    Then the result should fail with "Video not found"
    And no upload should be completed

  Scenario: Resolving a video's caption tracks
    Given a video with English captions and Spanish subtitles
    When I resolve the video's captionTracks
    Then they should list each language, label, and kind without storage details

  Scenario: Attaching captions to a video in the current community
    Given video "video-1" belongs to community "community-1"
    When I attach SUBTITLES in "es" labelled "Español" to "video-1"
    Then the caption file should be attached as "subtitles"

  Scenario: Refusing to attach captions to a video from another community
    Given video "video-9" belongs to community "community-2"
    When I attach CAPTIONS in "en" labelled "English" to "video-9"
    Then the result should fail with "Video not found"
    And no captions should be attached

  Scenario: Removing captions from a video in the current community
    Given video "video-1" belongs to community "community-1"
    When I remove the "en" captions from "video-1"
    Then the captions should be removed

  Scenario: Refusing to remove captions from a video in another community
    Given video "video-9" belongs to community "community-2"
    When I remove the "en" captions from "video-9"
    Then the result should fail with "Video not found"
    And no captions should be removed
