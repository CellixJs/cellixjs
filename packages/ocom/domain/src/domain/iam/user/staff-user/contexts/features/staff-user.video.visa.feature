Feature: <Visa> StaffUserVideoVisa

  Scenario: A staff user whose role can encode videos
    Given a staff user whose role has canEncodeVideos true
    When I check the video permissions for any community's video
    Then canEncodeVideos and canViewVideos should be true
    And canManageVideos, isOwnVideoViewing, and isSystemAccount should be false

  Scenario: A staff user whose role cannot encode videos
    Given a staff user whose role has canEncodeVideos false
    When I check the video permissions for any community's video
    Then canEncodeVideos and canViewVideos should be false

  Scenario: A staff user without a role
    Given a staff user without a role
    When I call determineIf with a function that returns true
    Then the result should be false
