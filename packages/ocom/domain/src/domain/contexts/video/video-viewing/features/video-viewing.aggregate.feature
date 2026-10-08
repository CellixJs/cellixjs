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
