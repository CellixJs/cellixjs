Feature: VideoReadRepository

  Background:
    Given a VideoReadRepository backed by a mock data source

  Scenario: Getting a video by id
    Given a video document exists with id "video-1"
    When I call getById with "video-1"
    Then I should receive a Video with title "Board meeting"

  Scenario: Getting a video that does not exist
    Given no video document exists with id "missing"
    When I call getById with "missing"
    Then I should receive null

  Scenario: Listing a community's videos newest first
    Given two video documents exist for community "6898b0c34b4a2fbc01e9c697"
    When I call getByCommunityId with "6898b0c34b4a2fbc01e9c697"
    Then I should receive both videos
    And the data source should have been queried by community, sorted by createdAt descending

  Scenario: Overriding the sort order
    Given two video documents exist for community "6898b0c34b4a2fbc01e9c697"
    When I call getByCommunityId with "6898b0c34b4a2fbc01e9c697" sorted by title
    Then the data source should have been queried with the title sort and no createdAt sort
