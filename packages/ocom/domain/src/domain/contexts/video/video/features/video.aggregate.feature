Feature: <AggregateRoot> Video

  Background:
    Given a passport that can manage and view videos
    And a valid CommunityEntityReference

  Scenario: Creating a new video
    When I create a new Video with title "Board meeting" and a 10 MB "video/mp4" source
    Then the video's title should be "Board meeting"
    And the video's status should be "AWAITING_UPLOAD"
    And the video's source should be the provided blob, content type, and size
    And the video should have no encoding output or failure

  Scenario: Creating a video without permission to manage videos
    Given a passport that can view but not manage videos
    When I try to create a new Video
    Then a PermissionError should be thrown with message "You do not have permission to upload videos"

  Scenario: Creating a video with an unsupported content type
    When I try to create a new Video with content type "image/png"
    Then an error should be thrown

  Scenario: Creating a video larger than 2 GiB
    When I try to create a new Video with a source of 2 GiB plus one byte
    Then an error should be thrown

  Scenario: Changing the title with permission to manage videos
    Given an existing video awaiting upload
    When I set the title to "Annual meeting"
    Then the video's title should be "Annual meeting"

  Scenario: Changing the title without permission
    Given an existing video awaiting upload loaded with a passport that cannot manage videos
    When I try to set the title to "Annual meeting"
    Then a PermissionError should be thrown with message "You do not have permission to update this title"

  Scenario: Changing the title to an empty value
    Given an existing video awaiting upload
    When I try to set the title to an empty string
    Then an error should be thrown

  Scenario: Completing an upload
    Given an existing video awaiting upload
    When I mark the upload completed
    Then the video's status should be "UPLOADED"

  Scenario: Completing an upload again
    Given an existing video that is uploaded
    When I mark the upload completed
    Then the video's status should be "UPLOADED"

  Scenario: Completing an upload for a video that is already encoding
    Given an existing video that is encoding
    When I try to mark the upload completed
    Then an error should be thrown with message containing "while it is ENCODING"

  Scenario: Completing an upload without permission
    Given an existing video awaiting upload loaded with a passport that cannot manage videos
    When I try to mark the upload completed
    Then a PermissionError should be thrown with message "You do not have permission to complete this upload"

  Scenario: Starting to encode an uploaded video as staff
    Given an existing video that is uploaded, loaded with a passport that can encode videos
    When I start encoding with destination container "videos-community-1" and prefix "video-1/"
    Then the video's status should be "ENCODING"
    And the video's output container should be "videos-community-1" with prefix "video-1/"

  Scenario: Retrying a failed video clears the failure
    Given an existing video that has failed, loaded with a passport that can encode videos
    When I start encoding with destination container "videos-community-1" and prefix "video-1/"
    Then the video's status should be "ENCODING"
    And the video should have no failure

  Scenario: Taking over a video that is already encoding
    Given an existing video that is encoding, loaded with a passport that can encode videos
    When I start encoding with destination container "videos-community-1" and prefix "video-1/"
    Then the video's status should be "ENCODING"

  Scenario: Starting to encode a video that is still awaiting upload
    Given an existing video awaiting upload loaded with a passport that can encode videos
    When I try to start encoding
    Then an error should be thrown with message containing "while it is AWAITING_UPLOAD"

  Scenario: Starting to encode a video that is already ready
    Given an existing video that is ready, loaded with a passport that can encode videos
    When I try to start encoding
    Then an error should be thrown with message containing "while it is READY"

  Scenario: Starting to encode without permission to encode videos
    Given an existing video that is uploaded
    When I try to start encoding
    Then a PermissionError should be thrown with message "You do not have permission to encode videos"

  Scenario: Starting to encode with an invalid output prefix
    Given an existing video that is uploaded, loaded with a passport that can encode videos
    When I try to start encoding with prefix "video-1" that has no trailing slash
    Then an error should be thrown
    And the video's status should be "UPLOADED"

  Scenario: Reporting which videos the caller can encode
    Given videos that are awaiting upload, uploaded, encoding, ready, and failed, loaded with a passport that can encode videos
    Then canEncode should be true only for the uploaded, encoding, and failed videos

  Scenario: Reporting that a member cannot encode videos
    Given an existing video that is uploaded
    Then canEncode should be false

  Scenario: Reporting whether the caller manages videos
    Given an existing video that is uploaded
    Then canManage should be true
    Given an existing video that is uploaded, loaded with a passport that can only watch videos
    Then canManage should be false

  Scenario: Resolving output paths to blob names
    Given an existing video that is encoding, loaded with a passport that can encode videos
    When I resolve the output paths "manifest.mpd" and "video/720/1.m4s"
    Then the blob names should be "video-1/manifest.mpd" and "video-1/video/720/1.m4s"

  Scenario: Rejecting output paths that escape the video's prefix
    Given an existing video that is encoding, loaded with a passport that can encode videos
    When I try to resolve the output paths "../video-2/manifest.mpd" and "/manifest.mpd"
    Then each attempt should throw an error

  Scenario: Rejecting too many output paths at once
    Given an existing video that is encoding, loaded with a passport that can encode videos
    When I try to resolve 1001 output paths
    Then an error should be thrown with message containing "At most 1000 output files"

  Scenario: Resolving output paths for a video that is not encoding
    Given an existing video that is uploaded, loaded with a passport that can encode videos
    When I try to resolve the output path "manifest.mpd"
    Then an error should be thrown with message containing "while it is UPLOADED"

  Scenario: Resolving output paths without permission to encode videos
    Given an existing video that is encoding
    When I try to resolve the output path "manifest.mpd"
    Then a PermissionError should be thrown with message "You do not have permission to encode videos"

  Scenario: Recording a successful encode
    Given an existing video that is encoding, loaded with a passport that can encode videos
    When I record a successful encode with manifests, a duration of 900 seconds, and rendition heights 1080, 720, 480, 360
    Then the video's status should be "READY"
    And the video's manifests, duration, and rendition heights should be recorded

  Scenario: Recording a successful encode again replaces the result
    Given an existing video that is ready, loaded with a passport that can encode videos
    When I record a successful encode with manifests, a duration of 450 seconds, and rendition heights 720, 480, 360
    Then the video's status should be "READY"
    And the video's duration should be 450 seconds

  Scenario: Recording an encode result without permission to encode videos
    Given an existing video that is encoding
    When I try to record a successful encode
    Then a PermissionError should be thrown with message "You do not have permission to record encoding results"

  Scenario: Recording a successful encode for a video that is only uploaded
    Given an existing video that is uploaded, loaded with a passport that can encode videos
    When I try to record a successful encode
    Then an error should be thrown with message containing "while it is UPLOADED"

  Scenario: Recording a failed encode
    Given an existing video that is encoding, loaded with a passport that can encode videos
    When I record a failed encode with code "unsupported-source" and message "The source has no video stream"
    Then the video's status should be "FAILED"
    And the video's failure should be code "unsupported-source" and message "The source has no video stream"

  Scenario: Recording a successful encode after a failure
    Given an existing video that has failed, loaded with a passport that can encode videos
    When I try to record a successful encode
    Then an error should be thrown with message containing "while it is FAILED"

  Scenario: Requesting playback of a ready video
    Given an existing video that is ready
    When I request playback
    Then I should get the output container and both manifest blob names

  Scenario: Requesting playback of a video that is not ready
    Given an existing video that is encoding
    When I try to request playback
    Then an error should be thrown with message containing "is not ready to play"

  Scenario: Requesting playback without permission to view videos
    Given an existing video that is ready, loaded with a passport that cannot view videos
    When I try to request playback
    Then a PermissionError should be thrown with message "You do not have permission to watch this video"

  Scenario: Attaching captions
    Given an existing video that is uploaded
    When I attach "captions" in "en" labelled "English"
    Then the track should be stored at "video-1/captions/en.vtt" in the community's video container
    And the video should have one caption track

  Scenario: Attaching captions in a language the video already has
    Given an existing video that is ready with English captions
    When I attach "subtitles" in "en" labelled "English (SDH)"
    Then the English track should be replaced

  Scenario: Attaching more caption tracks than allowed
    Given an existing video with 10 caption tracks
    When I try to attach captions in "ko"
    Then an error should be thrown with message containing "at most 10 caption tracks"

  Scenario: Attaching captions with invalid details
    Given an existing video that is uploaded
    When I try to attach captions with an invalid language, an empty label, or an unknown kind
    Then each attempt should throw

  Scenario: Attaching captions without permission to manage videos
    Given an existing video that is uploaded, loaded with a passport that can view but not manage videos
    When I try to attach captions in "en"
    Then a PermissionError should be thrown with message "You do not have permission to manage captions"

  Scenario: Removing captions
    Given an existing video that is ready with English captions
    When I remove the captions in "en"
    Then the removed track should be returned so its file can be deleted
    And the video should have no caption tracks

  Scenario: Removing captions in a language the video does not have
    Given an existing video that is ready with English captions
    When I try to remove the captions in "fr"
    Then an error should be thrown with message containing "has no captions in fr"

  Scenario: Removing captions without permission to manage videos
    Given an existing video that is ready with English captions, loaded with a passport that can view but not manage videos
    When I try to remove the captions in "en"
    Then a PermissionError should be thrown with message "You do not have permission to manage captions"

  Scenario: Requesting playback of a ready video with captions
    Given an existing video that is ready with English captions
    When I request playback
    Then the playback should include the English caption track

  Scenario: Encoded output cannot overwrite attached captions
    Given an existing video that is encoding, loaded with a passport that can encode videos
    When I try to resolve the output path "captions/en.vtt"
    Then an error should be thrown with message containing "cannot be written under captions/"
