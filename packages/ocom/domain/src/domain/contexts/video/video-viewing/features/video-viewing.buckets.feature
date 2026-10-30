Feature: Video Viewing Buckets

  Scenario: Merging played ranges
    When I merge the ranges 5 to 8, 0 to 3, 3 to 4, and 7 to 10
    Then the merged ranges should be 0 to 4 and 5 to 10
    And the original ranges should be unchanged

  Scenario: Finding how far play reaches without a gap
    When I check how far play reaches from 0 through 0 to 4, 4.5 to 6, and 9 to 10 with a 1 second tolerance
    Then play should reach 6 seconds

  Scenario: Clipping the last bucket to the end of the video
    When I get the bounds of buckets 1 and 2 of a 12 second video with 5 second buckets
    Then bucket 1 should span 5 to 10 seconds
    And bucket 2 should span 10 to 12 seconds

  Scenario: Counting a bucket only when half of it was played
    When I find the played buckets of a 12 second video played from 0 to 3, 6 to 7, and 10 to 11
    Then buckets 0 and 2 should be played

  Scenario: Adding buckets and joining adjacent runs
    When I add buckets 2 and 5 to the run 0 to 1
    Then the runs should be 0 to 2 and 5 to 5
    And bucket 5 should be included
    And bucket 3 should not be included

  Scenario: Listing the unwatched spans
    When I list the unwatched spans of a 12 second video where only bucket 1 was played
    Then the unwatched spans should be 0 to 5 and 10 to 12 seconds
