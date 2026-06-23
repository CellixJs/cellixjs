Feature: List staff roles

  Scenario: Returns all staff roles when roles exist
    Given the repository contains two staff roles
    When I call list
    Then it should return all staff roles

  Scenario: Returns an empty list when no staff roles exist
    Given the repository contains no staff roles
    When I call list
    Then it should return an empty list
