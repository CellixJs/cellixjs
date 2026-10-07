Feature: Video Caption Application Services

  Scenario: Attaching a WebVTT file
    Given a video in community "C0FFEE000000000000000001" that accepts "en" captions
    When I attach a WebVTT file in "en" labelled "English"
    Then the file should be stored as WebVTT at the track's blob in "videos-c0ffee000000000000000001"
    And the video should be saved

  Scenario: Attaching a SubRip file
    Given a video in community "C0FFEE000000000000000001" that accepts "en" captions
    When I attach a SubRip file in "en" labelled "English"
    Then the stored file should be the converted WebVTT

  Scenario: Attaching a file that is not captions
    Given a video in community "C0FFEE000000000000000001" that accepts "en" captions
    When I try to attach a file that is neither WebVTT nor SubRip
    Then it should fail with "Captions must be a WebVTT (.vtt) or SubRip (.srt) file"
    And nothing should be stored or saved

  Scenario: Attaching captions the domain refuses
    Given a video whose domain refuses captions with "You do not have permission to manage captions"
    When I try to attach a WebVTT file in "en" labelled "English"
    Then it should fail with "You do not have permission to manage captions"
    And nothing should be stored or saved

  Scenario: Removing captions
    Given a video with English captions
    When I remove the captions in "en"
    Then the video should be saved without them
    And the caption file should be deleted

  Scenario: Removing captions when the file cannot be deleted
    Given a video with English captions whose file cannot be deleted
    When I remove the captions in "en"
    Then the video should be saved without them
    And the removal should still succeed

  Scenario: Converting caption files to WebVTT
    Then WebVTT files should be kept with normalized line endings
    And SubRip timestamps should be converted and the WEBVTT header added
    And files larger than 1 MB, WebVTT files without cues, and other files should be rejected
