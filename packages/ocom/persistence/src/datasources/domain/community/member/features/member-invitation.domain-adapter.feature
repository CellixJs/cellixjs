Feature: <DomainAdapter> MemberInvitationDomainAdapter

  Background:
    Given a valid Mongoose MemberInvitation document with communityId "comm-1", email "test@example.com", message "Hello", status "PENDING", and a future expiresAt

  Scenario: Getting and setting the communityId property
    Given a MemberInvitationDomainAdapter for the document
    When I get the communityId property
    Then it should return "comm-1"
    When I set the communityId property to "comm-2"
    Then the document's communityId should be "comm-2"

  Scenario: Getting and setting the email property
    Given a MemberInvitationDomainAdapter for the document
    When I get the email property
    Then it should return "test@example.com"
    When I set the email property to "new@example.com"
    Then the document's email should be "new@example.com"

  Scenario: Getting and setting the message property
    Given a MemberInvitationDomainAdapter for the document
    When I get the message property
    Then it should return "Hello"
    When I set the message property to "Updated message"
    Then the document's message should be "Updated message"

  Scenario: Getting message when document message is undefined
    Given a MemberInvitationDomainAdapter for a document with no message
    When I get the message property
    Then it should return an empty string

  Scenario: Getting and setting the status property
    Given a MemberInvitationDomainAdapter for the document
    When I get the status property
    Then it should return "PENDING"
    When I set the status property to "SENT"
    Then the document's status should be "SENT"

  Scenario: Getting and setting the expiresAt property
    Given a MemberInvitationDomainAdapter for the document
    When I get the expiresAt property
    Then it should return the document's expiresAt date
    When I set the expiresAt property to a new future date
    Then the document's expiresAt should be updated

  Scenario: Getting invitedBy when it is a populated EndUser document
    Given a MemberInvitationDomainAdapter for a document with a populated invitedBy EndUser
    When I get the invitedBy property
    Then it should return an EndUserDomainAdapter instance

  Scenario: Getting invitedBy when it is an unpopulated ObjectId
    Given a MemberInvitationDomainAdapter for a document with invitedBy as an ObjectId "507f1f77bcf86cd799439011"
    When I get the invitedBy property
    Then it should return a stub with id "507f1f77bcf86cd799439011"

  Scenario: Getting invitedBy when it is not set
    Given a MemberInvitationDomainAdapter for a document with no invitedBy
    When I try to get the invitedBy property
    Then an error should be thrown indicating invitedBy is not populated

  Scenario: Setting invitedBy with a valid entity reference
    Given a MemberInvitationDomainAdapter for the document
    When I set the invitedBy property to an entity reference with id "507f1f77bcf86cd799439011"
    Then the document's invitedBy should be set to the corresponding ObjectId

  Scenario: Getting acceptedBy when it is undefined
    Given a MemberInvitationDomainAdapter for a document with no acceptedBy
    When I get the acceptedBy property
    Then it should return undefined

  Scenario: Getting acceptedBy when it is an unpopulated ObjectId
    Given a MemberInvitationDomainAdapter for a document with acceptedBy as an ObjectId "507f1f77bcf86cd799439012"
    When I get the acceptedBy property
    Then it should return a stub with id "507f1f77bcf86cd799439012"

  Scenario: Getting acceptedBy when it is a populated EndUser document
    Given a MemberInvitationDomainAdapter for a document with a populated acceptedBy EndUser
    When I get the acceptedBy property
    Then it should return an EndUserDomainAdapter instance

  Scenario: Setting acceptedBy to undefined clears the field
    Given a MemberInvitationDomainAdapter for the document
    When I set the acceptedBy property to undefined
    Then the document's acceptedBy should be undefined

  Scenario: Setting acceptedBy with a valid entity reference
    Given a MemberInvitationDomainAdapter for the document
    When I set the acceptedBy property to an entity reference with id "507f1f77bcf86cd799439012"
    Then the document's acceptedBy should be set to the corresponding ObjectId

  Scenario: Getting createdAt and updatedAt
    Given a MemberInvitationDomainAdapter for the document
    When I get the createdAt property
    Then it should return the document's createdAt date
    When I get the updatedAt property
    Then it should return the document's updatedAt date
