Feature: StaffUserVideoPassport

  Scenario: Getting a visa for a video
    Given a staff user whose role has canEncodeVideos true
    When I get the passport's visa for a video
    Then the visa should grant canEncodeVideos
    And the visa should not grant canManageVideos

  Scenario: Getting a visa for a video viewing
    Given a staff user whose role has canEncodeVideos true
    When I get the passport's visa for a video viewing
    Then the visa should not grant isOwnVideoViewing

  Scenario: Getting a visa for a staff user without a role
    Given a staff user with no role
    When I get the passport's visa for a video
    Then the visa should not grant canEncodeVideos
