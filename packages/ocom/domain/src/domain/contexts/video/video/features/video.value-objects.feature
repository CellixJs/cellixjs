Feature: <ValueObject> Video Value Objects

  Scenario: Creating a title trims whitespace
    When I create a title with "  Board meeting  "
    Then the value should be "Board meeting"

  Scenario: Creating a title that is too long
    When I try to create a title with a string of 201 characters
    Then an error should be thrown

  Scenario: Creating a status from a known status
    When I create a status with "ENCODING"
    Then the value should be "ENCODING"

  Scenario: Creating a status from an unknown status
    When I try to create a status with "DELETED"
    Then an error should be thrown

  Scenario: Accepting the supported video content types
    When I create content types "video/mp4", "video/quicktime", and "video/webm"
    Then each value should be accepted

  Scenario: Rejecting an unsupported content type
    When I try to create a content type with "application/octet-stream"
    Then an error should be thrown

  Scenario: Accepting a size at the 2 GiB limit
    When I create a size of 2147483648 bytes
    Then the value should be 2147483648

  Scenario: Rejecting an empty or fractional size
    When I try to create sizes of 0 and 1.5 bytes
    Then each attempt should throw an error

  Scenario: Accepting a valid container name
    When I create a container name with "videos-community-1"
    Then the value should be "videos-community-1"

  Scenario: Rejecting invalid container names
    When I try to create container names "Videos", "ab", "videos--community", and "-videos"
    Then each attempt should throw an error

  Scenario: Requiring a trailing slash on the output prefix
    When I create an output prefix with "video-1/" and try one with "video-1"
    Then the first should be accepted and the second should throw an error

  Scenario: Accepting rendition heights
    When I create rendition heights with 1080, 720, 480, and 360
    Then the value should be the heights in the same order

  Scenario: Rejecting an empty rendition list
    When I try to create rendition heights with an empty list
    Then an error should be thrown

  Scenario: Allowing no failure code
    When I create a failure code with null
    Then the value should be null
