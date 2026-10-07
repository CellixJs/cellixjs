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
    When the member's player reports 0 to 30 seconds played
    Then the existing viewing should record the report and be saved
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
