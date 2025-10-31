Feature: <ValueObject> Property Listing Detail Bedroom Detail Value Objects

  # RoomName
  Scenario: Creating a room name with valid value
    When I create a room name with "Master Bedroom"
    Then the value should be "Master Bedroom"

  Scenario: Creating a room name with leading and trailing whitespace
    When I create a room name with "  Master Bedroom  "
    Then the value should be "Master Bedroom"

  Scenario: Creating a room name with maximum allowed length
    When I create a room name with a string of 100 characters
    Then the value should be the 100 character string

  Scenario: Creating a room name with more than maximum allowed length
    When I try to create a room name with a string of 101 characters
    Then an error should be thrown indicating the room name is too long

  Scenario: Creating a room name with minimum allowed length
    When I create a room name with a string of 1 character
    Then the value should be the 1 character string

  Scenario: Creating a room name with less than minimum allowed length
    When I try to create a room name with an empty string
    Then an error should be thrown indicating the room name is too short

  Scenario: Creating a room name with null
    When I try to create a room name with null
    Then an error should be thrown indicating the room name is invalid

  # BedDescriptions
  Scenario: Creating bed descriptions with valid array
    When I create bed descriptions with ["King bed", "Queen bed"]
    Then the value should be ["King bed", "Queen bed"]

  Scenario: Creating bed descriptions with empty array
    When I create bed descriptions with []
    Then the value should be []

  Scenario: Creating bed descriptions with array above maximum length
    When I try to create bed descriptions with 21 items
    Then an error should be thrown indicating the bed descriptions array is too long