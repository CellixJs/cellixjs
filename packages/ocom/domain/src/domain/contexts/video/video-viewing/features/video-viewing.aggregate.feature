Feature: <AggregateRoot> VideoViewing

  Background:
    Given a ready 10-minute video in community "community-1"
    And a passport for member "member-1" of that community

  Scenario: Starting a viewing
    When member "member-1" starts watching the video
    Then the viewing should have 120 buckets of 5 seconds
    And no buckets should be watched
    And the unwatched ranges should be 0 to 600 seconds
    And the viewing should not be complete
    And the viewing should have no last position
    And it should be watched through 0 seconds

  Scenario: Starting a viewing for another member
    When I try to start a viewing for member "member-2"
    Then a PermissionError should be thrown with message "You can only record your own viewing of a video you can watch"

  Scenario: Starting a viewing of a video that is not ready
    Given the video is still encoding
    When I try to start a viewing for member "member-1"
    Then an error should be thrown with message "Video video-1 is not ready to watch"

  Scenario: Skipping from the first minute to the end
    Given member "member-1" started watching the video
    When the player reports 0 to 60 seconds played, 60 seconds later
    And the player reports 0 to 60 and 590 to 600 seconds played, 15 seconds later
    Then 14 of 120 buckets should be watched
    And the watched buckets should be 0 to 11 and 118 to 119
    And the unwatched ranges should be 60 to 590 seconds
    And the viewing should not be complete

  Scenario: Watching the whole video at normal speed
    Given member "member-1" started watching the video
    When the player reports what it has played every 15 seconds until the end
    Then 120 of 120 buckets should be watched
    And the viewing should be complete, at the report 600 seconds after starting

  Scenario: Missing only the final seconds still completes the viewing
    Given member "member-1" started watching the video
    When the player reports what it has played every 15 seconds until 590 seconds
    Then 118 of 120 buckets should be watched
    And the viewing should be complete

  Scenario: Reporting faster than real time
    Given member "member-1" started watching the video
    When the player reports 0 to 600 seconds played, 10 seconds later
    Then 10 of 120 buckets should be watched
    When the player reports 0 to 600 seconds played, 60 seconds later
    Then 34 of 120 buckets should be watched

  Scenario: Leaving the video idle does not bank credit
    Given member "member-1" started watching the video
    When the player reports 0 to 600 seconds played, 1 hour later
    Then 24 of 120 buckets should be watched

  Scenario: Scrubbing across a bucket does not count it
    Given member "member-1" started watching the video
    When the player reports 10 to 12.4 seconds played, 15 seconds later
    Then 0 of 120 buckets should be watched
    When the player reports 10 to 12.5 seconds played, 15 seconds later
    Then 1 of 120 buckets should be watched

  Scenario: Reporting the same ranges again
    Given member "member-1" started watching the video
    When the player reports 0 to 60 seconds played, 60 seconds later
    And the player reports 0 to 60 seconds played, 15 seconds later
    Then 12 of 120 buckets should be watched

  Scenario: Ranges past the end are cut at the end
    Given member "member-1" started watching the video
    When the player reports 595 to 700 seconds played, 15 seconds later
    Then the watched buckets should be 119 to 119

  Scenario: Invalid reports
    Given member "member-1" started watching the video
    When the player reports a range that ends before it starts
    Then an error should be thrown with message "A played range must end after it starts"
    When the player reports 201 ranges
    Then an error should be thrown with message "A report can include at most 200 played ranges"

  Scenario: Tracking how far the video was played without a gap
    Given member "member-1" started watching the video
    When the player reports 0 to 13 seconds played, 15 seconds later
    Then it should be watched through 13 seconds
    And the unwatched ranges should be 15 to 600 seconds
    When the player reports 0 to 13 and 13.6 to 25 seconds played, 15 seconds later
    Then it should be watched through 25 seconds

  Scenario: Skipping ahead does not move how far the video was watched through
    Given member "member-1" started watching the video
    When the player reports 0 to 13 and 40 to 50 seconds played, 30 seconds later
    Then it should be watched through 13 seconds

  Scenario: How far the video was watched through stays near the credited buckets
    Given member "member-1" started watching the video
    When the player reports 0 to 600 seconds played, 10 seconds later
    Then 10 of 120 buckets should be watched
    And it should be watched through 52.5 seconds

  Scenario: A viewing saved before this was tracked starts from its first unwatched part
    Given member "member-1"'s viewing has buckets 0 to 11 watched and was saved before this was tracked
    When the player reports 80 to 90 seconds played, 15 seconds later
    Then it should be watched through 60 seconds
    When the player reports 60 to 70 seconds played, 15 seconds later
    Then it should be watched through 70 seconds

  Scenario: Remembering where the player stopped
    Given member "member-1" started watching the video
    When the player reports 0 to 13 seconds played with the playhead at 13 seconds, 15 seconds later
    Then the last position should be 13 seconds
    When the player reports 0 to 13 seconds played with the playhead at 4 seconds, 15 seconds later
    Then the last position should be 4 seconds
    When the player reports 0 to 13 seconds played without a position, 15 seconds later
    Then the last position should still be 4 seconds

  Scenario: A position past the end is cut at the end
    Given member "member-1" started watching the video
    When the player reports 595 to 600 seconds played with the playhead at 700 seconds, 15 seconds later
    Then the last position should be 600 seconds

  Scenario: Reporting a negative position
    Given member "member-1" started watching the video
    When the player reports 0 to 13 seconds played with the playhead at -1 seconds
    Then an error should be thrown with message "The playhead position must be between 0 and 86400 seconds"
    And the viewing should have no last position

  Scenario: Recording another member's viewing
    Given member "member-2" of the community, who manages site content, loads member "member-1"'s viewing
    When they try to report 0 to 60 seconds played
    Then a PermissionError should be thrown with message "You can only record your own viewing"
    And they should be able to see the viewing

  Scenario: Seeing another member's viewing without managing site content
    Given member "member-2" of the community, who does not manage site content, loads member "member-1"'s viewing
    Then they should not be able to see the viewing

  Scenario: Rewinding before the viewing is complete
    Given member "member-1" started watching the video
    When the player reports 0 to 60 seconds played, 60 seconds later
    And the player reports replay counts 0,2,1 for session "session-1", 60 seconds later
    Then the first watch replays should be 0,2,1
    And there should be no post completion replays

  Scenario: Repeating a report does not count replays twice
    Given member "member-1" started watching the video
    When the player reports 0 to 60 seconds played, 60 seconds later
    And the player reports replay counts 0,2,1 for session "session-1", 60 seconds later
    And the player sends that same report again, 60 seconds later
    Then the first watch replays should be 0,2,1

  Scenario: A later report in the same session counts only what is new
    Given member "member-1" started watching the video
    When the player reports 0 to 60 seconds played, 60 seconds later
    And the player reports replay counts 0,2,1 for session "session-1", 60 seconds later
    And the player reports replay counts 0,5,1 for session "session-1", 60 seconds later
    Then the first watch replays should be 0,5,1

  Scenario: A new session counts its replays in full
    Given member "member-1" started watching the video
    When the player reports 0 to 60 seconds played, 60 seconds later
    And the player reports replay counts 0,2,1 for session "session-1", 60 seconds later
    And the player reports replay counts 0,3,0 for session "session-2", 60 seconds later
    Then the first watch replays should be 0,5,1

  Scenario: Replays after the viewing is complete count separately
    Given member "member-1" watched the whole video
    When the player reports replay counts 4,0,0 for session "session-2", 60 seconds later
    Then the post completion replays should be 4,0,0
    And there should be no first watch replays

  Scenario: Replays beyond the elapsed real time wait for the next report
    Given member "member-1" started watching the video
    When the player reports 0 to 60 seconds played, 60 seconds later
    And the player reports replay counts 0,40 for session "session-1", 5 seconds later
    Then the first watch replays should be 0,15
    When the player reports replay counts 0,40 for session "session-1", 20 seconds later
    Then the first watch replays should be 0,35

  Scenario: A replay count that is not a whole number
    Given member "member-1" started watching the video
    When the player reports replay counts 0,1.5 for session "session-1", 60 seconds later
    Then an error should be thrown with message "Replay count for bucket 1 must be a whole number between 0 and 10000"

  Scenario: Two sessions reporting in turn
    Given member "member-1" started watching the video
    When the player reports 0 to 60 seconds played, 60 seconds later
    And the player reports replay counts 0,2 for session "session-1", 60 seconds later
    And the player reports replay counts 0,1 for session "session-2", 60 seconds later
    And session "session-1" reports its counts 0,2 again, 60 seconds later
    Then the first watch replays should be 0,3

  Scenario: Replay counts past the end of the video do not stop progress saving
    Given member "member-1" started watching the video
    When the player reports 0 to 60 seconds played with replay counts for 200 parts, 60 seconds later
    Then 12 of 120 buckets should be watched
    And the replay counts should cover only the video's 120 parts

  Scenario: A report that arrives late does not move the last report time back
    Given member "member-1" started watching the video
    When the player reports 0 to 60 seconds played, 60 seconds later
    And a report made 30 seconds earlier arrives
    Then the last report time should still be 60 seconds after the start
