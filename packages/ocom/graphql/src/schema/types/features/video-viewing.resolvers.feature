Feature: Video Viewing Resolvers

  Background:
    Given a signed-in member whose request is scoped to community "community-1"

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
