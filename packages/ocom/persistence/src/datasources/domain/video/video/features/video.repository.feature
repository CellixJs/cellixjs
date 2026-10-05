Feature: Video Repository

  Background:
    Given a VideoRepository with a mock model and a passport that can manage videos

  Scenario: Getting a video by id with its community populated
    Given a video document exists with id "video-1"
    When I call getById with "video-1"
    Then it should return a Video domain object
    And the model should have been queried by id with the community populated

  Scenario: Getting a video that does not exist
    Given no video document exists with id "missing"
    When I call getById with "missing"
    Then an error should be thrown indicating "Video with id missing not found"

  Scenario: Creating a new video
    When I call getNewInstance with title "Board meeting", a valid source, and a community reference
    Then it should return a Video awaiting upload for that community
