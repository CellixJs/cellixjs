Feature: <Entity> MemberProfile

  Background:
    Given valid MemberProfileProps with name "Alice", email "alice@example.com", bio "Hello!", avatarDocumentId "doc-1", interests ["reading"], showInterests true, showEmail true, showProfile true, showLocation true, showProperties true
    And a valid CommunityVisa

  Scenario: Getting name, email, bio, avatarDocumentId, interests, showInterests, showEmail, showProfile, showLocation, and showProperties
    Given a MemberProfile entity
    Then the name property should return "Alice"
    And the email property should return "alice@example.com"
    And the bio property should return "Hello!"
    And the avatarDocumentId property should return "doc-1"
    And the interests property should return ["reading"]
    And the showInterests property should return true
    And the showEmail property should return true
    And the showProfile property should return true
    And the showLocation property should return true
    And the showProperties property should return true

  Scenario: Changing name with permission to manage members
    Given a MemberProfile entity with permission to manage members
    When I set the name to "Bob"
    Then the name property should return "Bob"

  Scenario: Changing name with permission to edit own member profile and is editing own member account
    Given a MemberProfile entity with permission to edit own member profile and is editing own member account
    When I set the name to "Bob"
    Then the name property should return "Bob"

  Scenario: Changing name without permission
    Given a MemberProfile entity without permission to manage members or edit own member profile
    When I try to set the name to "Bob"
    Then a PermissionError should be thrown

  Scenario: Changing name to an invalid value
    Given a MemberProfile entity with permission to manage members
    When I try to set the name to an invalid value (e.g., null or empty string)
    Then an error should be thrown indicating the value is invalid

  Scenario: Changing email with permission to manage members
    Given a MemberProfile entity with permission to manage members
    When I set the email to "bob@example.com"
    Then the email property should return "bob@example.com"

  Scenario: Changing email with permission to edit own member profile and is editing own member account
    Given a MemberProfile entity with permission to edit own member profile and is editing own member account
    When I set the email to "bob@example.com"
    Then the email property should return "bob@example.com"

  Scenario: Changing email without permission
    Given a MemberProfile entity without permission to manage members or edit own member profile
    When I try to set the email to "bob@example.com"
    Then a PermissionError should be thrown

  Scenario: Changing email to an invalid value
    Given a MemberProfile entity with permission to manage members
    When I try to set the email to an invalid value (e.g., "not-an-email")
    Then an error should be thrown indicating the value is invalid

  Scenario: Changing bio with permission to manage members
    Given a MemberProfile entity with permission to manage members
    When I set the bio to "New bio"
    Then the bio property should return "New bio"

  Scenario: Changing bio with permission to edit own member profile and is editing own member account
    Given a MemberProfile entity with permission to edit own member profile and is editing own member account
    When I set the bio to "New bio"
    Then the bio property should return "New bio"

  Scenario: Changing bio without permission
    Given a MemberProfile entity without permission to manage members or edit own member profile
    When I try to set the bio to "New bio"
    Then a PermissionError should be thrown

  Scenario: Changing bio to an invalid value
    Given a MemberProfile entity with permission to manage members
    When I try to set the bio to an invalid value (e.g., a string longer than allowed)
    Then an error should be thrown indicating the value is invalid

  Scenario: Changing avatarDocumentId with permission to manage members
    Given a MemberProfile entity with permission to manage members
    When I set the avatarDocumentId to "doc-2"
    Then the avatarDocumentId property should return "doc-2"

  Scenario: Changing avatarDocumentId with permission to edit own member profile and is editing own member account
    Given a MemberProfile entity with permission to edit own member profile and is editing own member account
    When I set the avatarDocumentId to "doc-2"
    Then the avatarDocumentId property should return "doc-2"

  Scenario: Changing avatarDocumentId without permission
    Given a MemberProfile entity without permission to manage members or edit own member profile
    When I try to set the avatarDocumentId to "doc-2"
    Then a PermissionError should be thrown

  Scenario: Changing interests with permission to manage members
    Given a MemberProfile entity with permission to manage members
    When I set the interests to ["sports", "music"]
    Then the interests property should return ["sports", "music"]

  Scenario: Changing interests with permission to edit own member profile and is editing own member account
    Given a MemberProfile entity with permission to edit own member profile and is editing own member account
    When I set the interests to ["sports", "music"]
    Then the interests property should return ["sports", "music"]

  Scenario: Changing interests without permission
    Given a MemberProfile entity without permission to manage members or edit own member profile
    When I try to set the interests to ["sports", "music"]
    Then a PermissionError should be thrown

  Scenario: Changing interests to an invalid value
    Given a MemberProfile entity with permission to manage members
    When I try to set the interests to an invalid value (e.g., a string instead of array)
    Then an error should be thrown indicating the value is invalid

  Scenario: Changing showInterests with permission to manage members
    Given a MemberProfile entity with permission to manage members
    When I set showInterests to false
    Then the showInterests property should return false

  Scenario: Changing showInterests with permission to edit own member profile and is editing own member account
    Given a MemberProfile entity with permission to edit own member profile and is editing own member account
    When I set showInterests to false
    Then the showInterests property should return false

  Scenario: Changing showInterests without permission
    Given a MemberProfile entity without permission to manage members or edit own member profile
    When I try to set showInterests to false
    Then a PermissionError should be thrown

  Scenario: Changing showEmail with permission to manage members
    Given a MemberProfile entity with permission to manage members
    When I set showEmail to false
    Then the showEmail property should return false

  Scenario: Changing showEmail with permission to edit own member profile and is editing own member account
    Given a MemberProfile entity with permission to edit own member profile and is editing own member account
    When I set showEmail to false
    Then the showEmail property should return false

  Scenario: Changing showEmail without permission
    Given a MemberProfile entity without permission to manage members or edit own member profile
    When I try to set showEmail to false
    Then a PermissionError should be thrown

  Scenario: Changing showProfile with permission to manage members
    Given a MemberProfile entity with permission to manage members
    When I set showProfile to false
    Then the showProfile property should return false

  Scenario: Changing showProfile with permission to edit own member profile and is editing own member account
    Given a MemberProfile entity with permission to edit own member profile and is editing own member account
    When I set showProfile to false
    Then the showProfile property should return false

  Scenario: Changing showProfile without permission
    Given a MemberProfile entity without permission to manage members or edit own member profile
    When I try to set showProfile to false
    Then a PermissionError should be thrown

  Scenario: Changing showLocation with permission to manage members
    Given a MemberProfile entity with permission to manage members
    When I set showLocation to false
    Then the showLocation property should return false

  Scenario: Changing showLocation with permission to edit own member profile and is editing own member account
    Given a MemberProfile entity with permission to edit own member profile and is editing own member account
    When I set showLocation to false
    Then the showLocation property should return false

  Scenario: Changing showLocation without permission
    Given a MemberProfile entity without permission to manage members or edit own member profile
    When I try to set showLocation to false
    Then a PermissionError should be thrown

  Scenario: Changing showProperties with permission to manage members
    Given a MemberProfile entity with permission to manage members
    When I set showProperties to false
    Then the showProperties property should return false

  Scenario: Changing showProperties with permission to edit own member profile and is editing own member account
    Given a MemberProfile entity with permission to edit own member profile and is editing own member account
    When I set showProperties to false
    Then the showProperties property should return false

  Scenario: Changing showProperties without permission
    Given a MemberProfile entity without permission to manage members or edit own member profile
    When I try to set showProperties to false
    Then a PermissionError should be thrown
>>>>>>> REPLACE
