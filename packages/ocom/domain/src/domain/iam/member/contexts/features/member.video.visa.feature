Feature: <Visa> MemberVideoVisa

  Background:
    Given a VideoEntityReference in community "community-1"

  Scenario: A member who can manage site content can manage and view videos
    Given a member of community "community-1" whose role can manage site content
    When I create a MemberVideoVisa and check the permissions
    Then canManageVideos should be true
    And canViewVideos should be true
    And isSystemAccount should be false

  Scenario: A member who cannot manage site content can only view videos
    Given a member of community "community-1" whose role cannot manage site content
    When I create a MemberVideoVisa and check the permissions
    Then canManageVideos should be false
    And canViewVideos should be true

  Scenario: A member of another community is denied
    Given a member of community "community-2" whose role can manage site content
    When I create a MemberVideoVisa and call determineIf with a function that returns true
    Then the result should be false
