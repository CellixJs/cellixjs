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

  Scenario: Accessing municipality subdivision property
    Given a property location address exists
    When I access the municipality subdivision property
    Then it should return the correct municipality subdivision

  Scenario: Accessing local name property
    Given a property location address exists
    When I access the local name property
    Then it should return the correct local name

  Scenario: Accessing country secondary subdivision property
    Given a property location address exists
    When I access the country secondary subdivision property
    Then it should return the correct country secondary subdivision

  Scenario: Accessing country tertiary subdivision property
    Given a property location address exists
    When I access the country tertiary subdivision property
    Then it should return the correct country tertiary subdivision

  Scenario: Accessing country subdivision property
    Given a property location address exists
    When I access the country subdivision property
    Then it should return the correct country subdivision

  Scenario: Accessing country subdivision name property
    Given a property location address exists
    When I access the country subdivision name property
    Then it should return the correct country subdivision name

  Scenario: Accessing postal code property
    Given a property location address exists
    When I access the postal code property
    Then it should return the correct postal code

  Scenario: Accessing extended postal code property
    Given a property location address exists
    When I access the extended postal code property
    Then it should return the correct extended postal code

  Scenario: Accessing country code property
    Given a property location address exists
    When I access the country code property
    Then it should return the correct country code

  Scenario: Accessing country property
    Given a property location address exists
    When I access the country property
    Then it should return the correct country

  Scenario: Accessing country code ISO3 property
    Given a property location address exists
    When I access the country code ISO3 property
    Then it should return the correct country code ISO3

  Scenario: Accessing freeform address property
    Given a property location address exists
    When I access the freeform address property
    Then it should return the correct freeform address

  Scenario: Accessing street name and number property
    Given a property location address exists
    When I access the street name and number property
    Then it should return the correct street name and number

  Scenario: Accessing route numbers property
    Given a property location address exists
    When I access the route numbers property
    Then it should return the correct route numbers

  Scenario: Accessing cross street property
    Given a property location address exists
    When I access the cross street property
    Then it should return the correct cross street