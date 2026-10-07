Feature: Video Viewing Repository

  Background:
    Given a VideoViewingRepository with a mock model and a passport for member "6898b0c34b4a2fbc01e9c6a1"

  Scenario: Getting a member's viewing of a video
    Given the member has a viewing of video "6898b0c34b4a2fbc01e9c6b2"
    When I call getByVideoAndMember for that video and member
    Then it should return a VideoViewing domain object with the stored buckets
    And the model should have been queried by video and member

  Scenario: Getting a viewing that does not exist
    Given the member has no viewing of video "6898b0c34b4a2fbc01e9c6b2"
    When I call getByVideoAndMember for that video and member
    Then it should return undefined

  Scenario: Starting a new viewing
    When I call getNewInstance for a ready 10-minute video and the member
    Then it should return a VideoViewing with 120 buckets for that video and member
