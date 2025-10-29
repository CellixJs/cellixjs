Feature: <Entity> Property Location Address Entity

  Scenario: Creating a property location address with valid props
    When I create a property location address with valid address fields
    Then the property location address should be created successfully

  Scenario: Accessing street number property
    Given a property location address exists
    When I access the street number property
    Then it should return the correct street number

  Scenario: Accessing street name property
    Given a property location address exists
    When I access the street name property
    Then it should return the correct street name

  Scenario: Accessing municipality property
    Given a property location address exists
    When I access the municipality property
    Then it should return the correct municipality