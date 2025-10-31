Feature: Creating and managing additional amenity entities

  Scenario: Creating an additional amenity with valid props
    When I create an additional amenity with valid category and amenities
    Then the additional amenity should be created successfully

  Scenario: Setting category with proper permissions
    Given an additional amenity exists
    When I set the category with proper permissions
    Then the category should be updated

  Scenario: Setting category without proper permissions
    Given an additional amenity exists
    When I try to set the category without proper permissions
    Then a permission error should be thrown

  Scenario: Setting amenities with proper permissions
    Given an additional amenity exists
    When I set the amenities with proper permissions
    Then the amenities should be updated

  Scenario: Setting amenities without proper permissions
    Given an additional amenity exists
    When I try to set the amenities without proper permissions
    Then a permission error should be thrown