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

  Scenario: Resolving whether the caller manages a video
    Given a video the caller manages
    When I resolve the video's canManage
    Then it should be true

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

  Scenario: Recording watch progress on a video in the current community
    Given video "video-1" belongs to community "community-1"
    When I record that 0 to 15 seconds of "video-1" were played
    Then the progress should be recorded for member "member-1"
    And the updated viewing should be returned

  Scenario: Recording where the player stopped
    Given video "video-1" belongs to community "community-1"
    When I record that 0 to 15 seconds of "video-1" were played with the playhead at 12 seconds
    Then the progress should be recorded with position 12

  Scenario: Refusing watch progress on a video from another community
    Given video "video-9" belongs to community "community-2"
    When I record that 0 to 15 seconds of "video-9" were played
    Then the result should fail with "Video not found"
    And no progress should be recorded

  Scenario: Refusing watch progress without a member
    Given video "video-1" belongs to community "community-1"
    And a signed-in user whose request is not acting as a member
    When I record that 0 to 15 seconds of "video-1" were played
    Then the result should fail with "Unauthorized"

  Scenario: Resolving a video's viewings
    When I resolve myViewing and viewings for video "video-1"
    Then myViewing should be the caller's viewing as member "member-1"
    And viewings should be the viewings the caller may see

  Scenario: Resolving myViewing without a member
    Given a signed-in user whose request is not acting as a member
    When I resolve myViewing for video "video-1"
    Then myViewing should be null

  Scenario: Resolving a viewing's member and unwatched spans
    Given a viewing by member "member-2" with 60 to 590 seconds unwatched
    When I resolve the viewing's member and unwatched fields
    Then the member should be looked up by id "member-2"
    And unwatched should be 60 to 590 seconds

  Scenario: Resolving a viewing whose member cannot be loaded
    Given a viewing by a member who cannot be loaded
    When I resolve the viewing's member
    Then the member should be null
