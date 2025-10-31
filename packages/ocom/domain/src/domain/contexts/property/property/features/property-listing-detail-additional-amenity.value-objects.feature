Feature: Creating and validating additional amenity value objects

  Scenario: Creating a valid category
    When I create a category with "Electronics"
    Then the value should be "Electronics"

  Scenario: Creating a category with leading/trailing whitespace
    When I create a category with "  Kitchen  "
    Then the value should be "Kitchen"

  Scenario: Creating a category that is too short
    When I try to create a category with ""
    Then it should throw an error "Too short"

  Scenario: Creating a category that is too long
    When I try to create a category with a string longer than 100 characters
    Then it should throw an error "Too long"

  Scenario: Creating a category with null
    When I try to create a category with null
    Then it should throw an error "Wrong raw value type"

  Scenario: Creating valid amenities
    When I create amenities with ["WiFi", "Parking", "Pool"]
    Then the amenities should contain ["WiFi", "Parking", "Pool"]

  Scenario: Creating amenities with too many items
    When I try to create amenities with more than 20 items
    Then it should throw an error "Too long"

  Scenario: Creating amenities with null
    When I try to create amenities with null
    Then it should throw an error "Wrong raw value type"