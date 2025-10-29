Feature: <Entity> Property Listing Detail Entity

  Scenario: Creating a property listing detail with valid props
    When I create a property listing detail with valid props
    Then the property listing detail should be created successfully

  Scenario: Setting price with proper permissions
    Given a property listing detail exists
    When I set the price with proper permissions
    Then the price should be updated

  Scenario: Setting price without proper permissions
    Given a property listing detail exists
    When I try to set the price without proper permissions
    Then a permission error should be thrown

  Scenario: Accessing bedroom details
    Given a property listing detail exists
    When I access the bedroom details
    Then it should return the bedroom details

  Scenario: Requesting new bedroom with proper permissions
    Given a property listing detail exists
    When I request a new bedroom with proper permissions
    Then a new bedroom should be returned

  Scenario: Requesting new bedroom without proper permissions
    Given a property listing detail exists
    When I try to request a new bedroom without proper permissions
    Then a permission error should be thrown

  Scenario: Accessing additional amenities
    Given a property listing detail exists
    When I access the additional amenities
    Then it should return the additional amenities

  Scenario: Requesting new additional amenity with proper permissions
    Given a property listing detail exists
    When I request a new additional amenity with proper permissions
    Then a new additional amenity should be returned

  Scenario: Removing image with proper permissions
    Given a property listing detail exists
    When I remove an image with proper permissions
    Then the image should be removed