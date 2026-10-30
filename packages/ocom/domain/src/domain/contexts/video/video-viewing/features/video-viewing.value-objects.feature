Feature: <ValueObject> Video Viewing Value Objects

  Scenario: Creating a reference id
    When I create a reference id with "video-1"
    Then the value should be "video-1"

  Scenario: Rejecting an empty reference id
    When I try to create a reference id with ""
    Then an error should be thrown

  Scenario: Rejecting a reference id that is too long
    When I try to create a reference id with a string of 65 characters
    Then an error should be thrown

  Scenario: Accepting positions from the start to one day
    When I create positions of 0 and 86400 seconds
    Then both positions should be accepted

  Scenario: Rejecting a negative position
    When I try to create a position of -1 seconds
    Then an error should be thrown

  Scenario: Rejecting a position past one day
    When I try to create a position of 86401 seconds
    Then an error should be thrown
