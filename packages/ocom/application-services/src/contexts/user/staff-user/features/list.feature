Feature: List staff users

  Scenario: Returns all staff users when users exist
    Given the repository contains two staff users
    When I call list
    Then it should return all staff users

  Scenario: Returns an empty list when no staff users exist
    Given the repository contains no staff users
    When I call list
    Then it should return an empty list
