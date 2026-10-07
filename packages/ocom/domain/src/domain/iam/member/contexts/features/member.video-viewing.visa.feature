Feature: <Visa> MemberVideoViewingVisa

  Background:
    Given a VideoViewingEntityReference in community "community-1" for member "member-1"

  Scenario: A member looking at their own viewing
    Given member "member-1" of community "community-1" whose role cannot manage site content
    When I create a MemberVideoViewingVisa and check the permissions
    Then isOwnVideoViewing should be true
    And canViewVideos should be true
    And canManageVideos should be false

  Scenario: A member who manages site content looking at another member's viewing
    Given member "member-2" of community "community-1" whose role can manage site content
    When I create a MemberVideoViewingVisa and check the permissions
    Then isOwnVideoViewing should be false
    And canManageVideos should be true

  Scenario: A member of another community is denied
    Given member "member-1" of community "community-2" whose role can manage site content
    When I create a MemberVideoViewingVisa and call determineIf with a function that returns true
    Then the result should be false
