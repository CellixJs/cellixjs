Feature: Video Request Upload Application Service

  Scenario: Requesting an upload for a community
    Given a community exists with id "c0ffee000000000000000001"
    When I request an upload titled "Board meeting" for a 1024-byte "video/mp4" file
    Then a video should be created awaiting upload with its original in "video-uploads" under the community id
    And the uploads container should be created if missing
    And I should receive a signed PUT for that blob locked to the size and content type
    And the upload headers should include the Authorization header but not Content-Length

  Scenario: Requesting an upload for a community that does not exist
    Given no community exists with id "c0ffee000000000000000001"
    When I try to request an upload
    Then it should fail with "Community not found"
    And nothing should be signed

  Scenario: Requesting an upload without permission to manage videos
    Given a community exists with id "c0ffee000000000000000001"
    And the domain rejects creating the video
    When I try to request an upload
    Then it should fail with "You do not have permission to upload videos"
    And nothing should be signed
