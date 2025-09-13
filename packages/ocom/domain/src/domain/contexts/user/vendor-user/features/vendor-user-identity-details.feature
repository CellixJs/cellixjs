Feature: <Entity> VendorUserIdentityDetails

  Background:
    Given valid VendorUserIdentityDetailsProps with lastName "Smith", legalNameConsistsOfOneName false, and restOfName "Alice"
    And a valid UserVisa

  Scenario: Creating a new VendorUserIdentityDetails instance
    When I create a new VendorUserIdentityDetails using getNewInstance with lastName "Smith", legalNameConsistsOfOneName false, and restOfName "Alice"
    Then the entity's lastName should be "Smith"
    And the entity's legalNameConsistsOfOneName should be false
    And the entity's restOfName should be "Alice"

  Scenario: Changing the lastName with permission to edit own account
    Given an VendorUserIdentityDetails entity with permission to edit own account
    When I set the lastName to "Johnson"
    Then the entity's lastName should be "Johnson"

  Scenario: Changing the lastName with permission to manage vendor users
    Given an VendorUserIdentityDetails entity with permission to manage vendor users
    When I set the lastName to "Johnson"
    Then the entity's lastName should be "Johnson"

  Scenario: Changing the lastName without permission
    Given an VendorUserIdentityDetails entity without permission to edit own account or manage vendor users
    When I try to set the lastName to "Johnson"
    Then a PermissionError should be thrown

  Scenario: Changing the lastName to an invalid value
    Given an VendorUserIdentityDetails entity with permission to edit own account
    When I try to set the lastName to an empty string
    Then an error should be thrown indicating the lastName is too short

  Scenario: Changing the legalNameConsistsOfOneName with permission to edit own account
    Given an VendorUserIdentityDetails entity with permission to edit own account
    When I set the legalNameConsistsOfOneName to true
    Then the entity's legalNameConsistsOfOneName should be true

  Scenario: Changing the legalNameConsistsOfOneName with permission to manage vendor users
    Given an VendorUserIdentityDetails entity with permission to manage vendor users
    When I set the legalNameConsistsOfOneName to true
    Then the entity's legalNameConsistsOfOneName should be true

  Scenario: Changing the legalNameConsistsOfOneName without permission
    Given an VendorUserIdentityDetails entity without permission to edit own account or manage vendor users
    When I try to set the legalNameConsistsOfOneName to true
    Then a PermissionError should be thrown

  Scenario: Changing the restOfName with permission to edit own account
    Given an VendorUserIdentityDetails entity with permission to edit own account
    When I set the restOfName to "Bob"
    Then the entity's restOfName should be "Bob"

  Scenario: Changing the restOfName with permission to manage vendor users
    Given an VendorUserIdentityDetails entity with permission to manage vendor users
    When I set the restOfName to "Bob"
    Then the entity's restOfName should be "Bob"

  Scenario: Changing the restOfName without permission
    Given an VendorUserIdentityDetails entity without permission to edit own account or manage vendor users
    When I try to set the restOfName to "Bob"
    Then a PermissionError should be thrown

  Scenario: Changing the restOfName to an invalid value
    Given an VendorUserIdentityDetails entity with permission to edit own account
    When I try to set the restOfName to an empty string
    Then an error should be thrown indicating the restOfName is too short

  Scenario: Clearing the restOfName with permission
    Given an VendorUserIdentityDetails entity with permission to edit own account
    When I set the restOfName to undefined
    Then the entity's restOfName should be undefined
