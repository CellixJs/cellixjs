Feature: Video Staff Encoding Application Services

  Scenario: Listing videos the caller can encode
    Given uploaded, encoding, and failed videos, only some of which the caller can encode
    When I query videos awaiting encoding
    Then only the videos the caller can encode should be returned, in the repository's order

  Scenario: Starting to encode a video
    Given an uploaded video "video-1" in community "C0FFEE000000000000000001"
    When I start encoding "video-1"
    Then the video should start encoding into "videos-c0ffee000000000000000001" under "video-1/" and be saved
    And the output container should be created if missing
    And I should receive a 6-hour read link for the original and the output destination

  Scenario: Starting to encode when the domain refuses
    Given a video whose startEncoding fails with "You do not have permission to encode videos"
    When I try to start encoding "video-1"
    Then it should fail with "You do not have permission to encode videos"
    And no read link should be issued

  Scenario: Requesting upload links for encoded output
    Given an encoding video "video-1" whose output goes to "videos-c1" under "video-1/"
    When I request upload links for "manifest.mpd" and "video/720/1.m4s"
    Then I should receive one 6-hour write link per path, for the matching blob under "video-1/"

  Scenario: Requesting upload links for a video that does not exist
    Given no video exists
    When I try to request upload links for "manifest.mpd"
    Then it should fail with "Video not found"

  Scenario: Recording a successful encode
    Given an encoding video "video-1" whose output goes under "video-1/"
    When I record a successful encode with manifests "manifest.mpd" and "master.m3u8", 912.4 seconds, and heights 1080, 720
    Then the video should record success with blob names "video-1/manifest.mpd" and "video-1/master.m3u8" and be saved

  Scenario: Recording a failed encode
    Given an encoding video "video-1" whose output goes under "video-1/"
    When I record a failed encode with code "unsupported-source" and message "No video stream"
    Then the video should record that failure and be saved
