Feature: <ValueObject> Property Listing Detail Value Objects

  # Price
  Scenario: Creating a price with valid value
    When I create a price with 100000
    Then the value should be 100000

  Scenario: Creating a price with null
    When I create a price with null
    Then the value should be null

  Scenario: Creating a price with negative value
    When I try to create a price with -1000
    Then an error should be thrown indicating the price is invalid

  # RentHigh
  Scenario: Creating a rent high with valid value
    When I create a rent high with 2000
    Then the value should be 2000

  Scenario: Creating a rent high with null
    When I create a rent high with null
    Then the value should be null

  Scenario: Creating a rent high with negative value
    When I try to create a rent high with -500
    Then an error should be thrown indicating the rent high is invalid

  # Bedrooms
  Scenario: Creating bedrooms with valid value
    When I create bedrooms with 3
    Then the value should be 3

  Scenario: Creating bedrooms with null
    When I create bedrooms with null
    Then the value should be null

  Scenario: Creating bedrooms with negative value
    When I try to create bedrooms with -1
    Then an error should be thrown indicating the bedrooms is invalid

  Scenario: Creating bedrooms with value above maximum
    When I try to create bedrooms with 1001
    Then an error should be thrown indicating the bedrooms is invalid

  # Description
  Scenario: Creating a description with valid value
    When I create a description with "A nice property description"
    Then the value should be "A nice property description"

  Scenario: Creating a description with null
    When I create a description with null
    Then the value should be null

  Scenario: Creating a description with leading and trailing whitespace
    When I create a description with "  A nice property  "
    Then the value should be "A nice property"

  Scenario: Creating a description with maximum allowed length
    When I create a description with a string of 5000 characters
    Then the value should be the 5000 character string

  Scenario: Creating a description with more than maximum allowed length
    When I try to create a description with a string of 5001 characters
    Then an error should be thrown indicating the description is too long

  # Amenities
  Scenario: Creating amenities with valid array
    When I create amenities with ["pool", "gym", "parking"]
    Then the value should be ["pool", "gym", "parking"]

  Scenario: Creating amenities with null
    When I create amenities with null
    Then the value should be null

  Scenario: Creating amenities with empty array
    When I create amenities with []
    Then the value should be []

  Scenario: Creating amenities with array above maximum length
    When I try to create amenities with 51 items
    Then an error should be thrown indicating the amenities array is too long

  # Images
  Scenario: Creating images with valid array
    When I create images with ["image1.jpg", "image2.png"]
    Then the value should be ["image1.jpg", "image2.png"]

  Scenario: Creating images with null
    When I create images with null
    Then the value should be null

  Scenario: Creating images with array above maximum length
    When I try to create images with 51 items
    Then an error should be thrown indicating the images array is too long

  # ListingAgentEmail
  Scenario: Creating a listing agent email with valid value
    When I create a listing agent email with "agent@example.com"
    Then the value should be "agent@example.com"

  Scenario: Creating a listing agent email with null
    When I create a listing agent email with null
    Then the value should be null

  Scenario: Creating a listing agent email with invalid format
    When I try to create a listing agent email with "invalid-email"
    Then an error should be thrown indicating the email is invalid