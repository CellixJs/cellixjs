Feature: <DomainAdapter> MemberDomainAdapter

  Background:
    Given a valid Mongoose Member document with memberName "Test Member", cybersourceCustomerId "test-customer-id", populated community, role, and profile fields

  Scenario: Getting and setting the memberName property
    Given a MemberDomainAdapter for the document
    When I get the memberName property
    Then it should return "Test Member"
    When I set the memberName property to "New Member Name"
    Then the document's memberName should be "New Member Name"

  Scenario: Getting and setting the cybersourceCustomerId property
    Given a MemberDomainAdapter for the document
    When I get the cybersourceCustomerId property
    Then it should return "test-customer-id"
    When I set the cybersourceCustomerId property to "new-customer-id"
    Then the document's cybersourceCustomerId should be "new-customer-id"

  Scenario: Getting the communityId property
    Given a MemberDomainAdapter for the document
    When I get the communityId property
    Then it should return the community's id as a string

  Scenario: Getting the community property when populated
    Given a MemberDomainAdapter for the document
    When I get the community property
    Then it should return a CommunityDomainAdapter instance with the correct community data

  Scenario: Getting the community property when not populated
    Given a MemberDomainAdapter for a document with community as an ObjectId
    When I get the community property
    Then an error should be thrown indicating "community is not populated or is not of the correct type"

  Scenario: Setting the community property with a valid Community domain object
    Given a MemberDomainAdapter for the document
    And a valid Community domain object
    When I set the community property to the Community domain object
    Then the document's community should be set to the community's doc

  Scenario: Setting the community property with an invalid value
    Given a MemberDomainAdapter for the document
    And an object that is not a Community domain object
    When I try to set the community property to the invalid object
    Then an error should be thrown indicating "community reference is missing id"

  Scenario: Getting the role property when populated
    Given a MemberDomainAdapter for the document
    When I get the role property
    Then it should return an EndUserRoleDomainAdapter instance with the correct role data

  Scenario: Getting the role property when not populated
    Given a MemberDomainAdapter for a document with role as an ObjectId
    When I get the role property
    Then an error should be thrown indicating "role is not populated or is not of the correct type"

  Scenario: Setting the role property with a valid EndUserRole domain object
    Given a MemberDomainAdapter for the document
    And a valid EndUserRole domain object
    When I set the role property to the EndUserRole domain object
    Then the document's role should be set to the role's doc

  Scenario: Setting the role property with an invalid value
    Given a MemberDomainAdapter for the document
    And an object that is not an EndUserRole domain object
    When I try to set the role property to the invalid object
    Then an error should be thrown indicating "role reference is missing id"

  Scenario: Getting the profile property
    Given a MemberDomainAdapter for the document
    When I get the profile property
    Then it should return a MemberProfileDomainAdapter instance

  Scenario: Getting the accounts property
    Given a MemberDomainAdapter for the document
    When I get the accounts property
    Then it should return a MongoosePropArray of MemberAccount references

  Scenario: Getting the customViews property
    Given a MemberDomainAdapter for the document
    When I get the customViews property
    Then it should return a MongoosePropArray of MemberCustomView references

  Scenario: MemberAccountDomainAdapter getting and setting firstName property
    Given a MemberAccountDomainAdapter for a member account document
    When I get the firstName property
    Then it should return "John"
    When I set the firstName property to "Jane"
    Then the document's firstName should be "Jane"

  Scenario: MemberAccountDomainAdapter getting and setting lastName property
    Given a MemberAccountDomainAdapter for a member account document
    When I get the lastName property
    Then it should return "Doe"
    When I set the lastName property to "Smith"
    Then the document's lastName should be "Smith"

  Scenario: MemberAccountDomainAdapter getting user property when populated
    Given a MemberAccountDomainAdapter for a member account document with populated user
    When I get the user property
    Then it should return an EndUserDomainAdapter instance with the correct user data

  Scenario: MemberAccountDomainAdapter setting user property with valid EndUser domain object
    Given a MemberAccountDomainAdapter for a member account document
    And a valid EndUser domain object
    When I set the user property to the EndUser domain object
    Then the document's user should be set to the user's doc

  Scenario: MemberAccountDomainAdapter getting and setting statusCode property
    Given a MemberAccountDomainAdapter for a member account document
    When I get the statusCode property
    Then it should return "active"
    When I set the statusCode property to "inactive"
    Then the document's statusCode should be "inactive"

  Scenario: MemberAccountDomainAdapter getting createdBy property when populated
    Given a MemberAccountDomainAdapter for a member account document with populated createdBy
    When I get the createdBy property
    Then it should return an EndUserDomainAdapter instance with the correct user data

  Scenario: MemberAccountDomainAdapter setting createdBy property with valid EndUser domain object
    Given a MemberAccountDomainAdapter for a member account document
    And a valid EndUser domain object
    When I set the createdBy property to the EndUser domain object
    Then the document's createdBy should be set to the user's doc

  Scenario: MemberCustomViewDomainAdapter getting and setting name property
    Given a MemberCustomViewDomainAdapter for a custom view document
    When I get the name property
    Then it should return "My Custom View"
    When I set the name property to "Updated View"
    Then the document's name should be "Updated View"

  Scenario: MemberCustomViewDomainAdapter getting and setting type property
    Given a MemberCustomViewDomainAdapter for a custom view document
    When I get the type property
    Then it should return "list"
    When I set the type property to "grid"
    Then the document's type should be "grid"

  Scenario: MemberCustomViewDomainAdapter getting and setting filters property
    Given a MemberCustomViewDomainAdapter for a custom view document
    When I get the filters property
    Then it should return the expected filters object
    When I set the filters property to a new filters object
    Then the document's filters should be updated

  Scenario: MemberCustomViewDomainAdapter getting and setting sortOrder property
    Given a MemberCustomViewDomainAdapter for a custom view document
    When I get the sortOrder property
    Then it should return "asc"
    When I set the sortOrder property to "desc"
    Then the document's sortOrder should be "desc"

  Scenario: MemberCustomViewDomainAdapter getting and setting columnsToDisplay property
    Given a MemberCustomViewDomainAdapter for a custom view document
    When I get the columnsToDisplay property
    Then it should return the expected columns array
    When I set the columnsToDisplay property to a new columns array
    Then the document's columnsToDisplay should be updated

  Scenario: MemberProfileDomainAdapter getting and setting name property
    Given a MemberProfileDomainAdapter for a profile document
    When I get the name property
    Then it should return "John Doe"
    When I set the name property to "Jane Smith"
    Then the document's name should be "Jane Smith"

  Scenario: MemberProfileDomainAdapter getting and setting email property
    Given a MemberProfileDomainAdapter for a profile document
    When I get the email property
    Then it should return "john@example.com"
    When I set the email property to "jane@example.com"
    Then the document's email should be "jane@example.com"

  Scenario: MemberProfileDomainAdapter getting and setting bio property
    Given a MemberProfileDomainAdapter for a profile document
    When I get the bio property
    Then it should return "Software developer"
    When I set the bio property to "Product manager"
    Then the document's bio should be "Product manager"

  Scenario: MemberProfileDomainAdapter getting and setting avatarDocumentId property
    Given a MemberProfileDomainAdapter for a profile document
    When I get the avatarDocumentId property
    Then it should return "avatar-123"
    When I set the avatarDocumentId property to "avatar-456"
    Then the document's avatarDocumentId should be "avatar-456"

  Scenario: MemberProfileDomainAdapter getting and setting interests property
    Given a MemberProfileDomainAdapter for a profile document
    When I get the interests property
    Then it should return the expected interests array
    When I set the interests property to a new interests array
    Then the document's interests should be updated

  Scenario: MemberProfileDomainAdapter getting and setting showInterests property
    Given a MemberProfileDomainAdapter for a profile document
    When I get the showInterests property
    Then it should return true
    When I set the showInterests property to false
    Then the document's showInterests should be false

  Scenario: MemberProfileDomainAdapter getting and setting showEmail property
    Given a MemberProfileDomainAdapter for a profile document
    When I get the showEmail property
    Then it should return true
    When I set the showEmail property to false
    Then the document's showEmail should be false

  Scenario: MemberProfileDomainAdapter getting and setting showProfile property
    Given a MemberProfileDomainAdapter for a profile document
    When I get the showProfile property
    Then it should return true
    When I set the showProfile property to false
    Then the document's showProfile should be false

  Scenario: MemberProfileDomainAdapter getting and setting showLocation property
    Given a MemberProfileDomainAdapter for a profile document
    When I get the showLocation property
    Then it should return true
    When I set the showLocation property to false
    Then the document's showLocation should be false

  Scenario: MemberProfileDomainAdapter getting and setting showProperties property
    Given a MemberProfileDomainAdapter for a profile document
    When I get the showProperties property
    Then it should return true
    When I set the showProperties property to false
    Then the document's showProperties should be false
