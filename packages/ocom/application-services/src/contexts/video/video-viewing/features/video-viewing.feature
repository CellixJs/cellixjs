Feature: Video Viewing Application Service

  Scenario: Building the video viewing application service
    When I build the VideoViewing application service
    Then it should expose recordProgress, queryMine, and queryByVideo

  Scenario: The first report starts the member's viewing
    Given a ready video the member has not started watching
    When the member's player reports 0 to 15 seconds played
    Then a new viewing should be started for that video and member
    And the report should be recorded on it and saved

  Scenario: Later reports update the member's viewing
    Given a ready video the member has started watching
    When the member's player reports 0 to 30 seconds played with the playhead at 30 seconds
    Then the existing viewing should record the report and position and be saved
    And no new viewing should be started

  Scenario: Two first reports race to start the viewing
    Given a ready video the member has not started watching
    And another report starts the viewing while this one is saving
    When the member's player reports 0 to 15 seconds played
    Then the report should be retried and recorded on the viewing the other report started

  Scenario: Reporting progress on a video that does not exist
    Given no video with that id
    When the member's player reports 0 to 15 seconds played
    Then it should fail with "Video not found"

  Scenario: Getting the caller's own viewing
    Given the read repository has the member's viewing, which the caller may see
    When I query the caller's viewing of the video
    Then I should receive it

  Scenario: Getting a viewing the caller may not see
    Given the read repository has a viewing the caller may not see
    When I query the caller's viewing of the video
    Then I should receive null

  Scenario: Listing a video's viewings
    Given the read repository has two viewings, of which the caller may see one
    When I query the video's viewings
    Then I should receive only the viewing the caller may see

  Scenario: Adding up replays across a video's viewings
    Given the read repository has two viewings with replay counts, of which the caller may see both
    When I query the video's replay heatmap
    Then the first watch counts should be 1,3,0 and the post completion counts should be 0,0,2
    And it should count 2 viewings
    And the viewer counts should be 2,1,1

  Scenario: A replay heatmap leaves out viewings the caller may not see
    Given the read repository has two viewings with replay counts, of which the caller may see one
    When I query the video's replay heatmap
    Then the first watch counts should be 1,1,0 and the post completion counts should be 0,0,0
    And it should count 1 viewing
    And the viewer counts should be 1,0,1

  Scenario: A replay heatmap for a video nobody has watched
    Given the read repository has no viewings
    When I query the video's replay heatmap
    Then I should receive null

  Scenario: A replay heatmap for a video that was re-encoded shorter
    Given the read repository has a viewing from when the video was longer
    When I query the video's replay heatmap
    Then the counts should cover only the video's current length
    And the viewer counts should cover only the video's current length
