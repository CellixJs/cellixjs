Feature: Video Complete Upload Application Service

  Scenario: Completing an upload that arrived with the declared size
    Given a video awaiting upload whose 1024-byte original is in storage
    When I complete the upload
    Then the video should be marked uploaded and saved

  Scenario: Completing an upload that never arrived
    Given a video awaiting upload whose original is not in storage
    When I try to complete the upload
    Then it should fail with "The upload has not been received"
    And the video should not be marked uploaded

  Scenario: Completing an upload with the wrong size
    Given a video awaiting upload whose original in storage is 512 bytes instead of 1024
    When I try to complete the upload
    Then it should fail with "The upload is 512 bytes but 1024 bytes were expected"
    And the video should not be marked uploaded
