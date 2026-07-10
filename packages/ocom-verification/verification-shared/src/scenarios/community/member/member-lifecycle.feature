Feature: Community member lifecycle operations

	As a community owner or administrator
	I want to create, update, associate accounts to, list, filter, and delete members within a specific community
	So that member records remain accurate and user-to-community access stays correctly scoped

	Background:
		Given Alice is signed in as a community owner for member management
		And Alice has a community named "Green Oaks"
		And Alice has a community named "Blue Harbor"
		And Charlie is an existing end-user account

	Scenario: Create a member record in a community
		When Alice creates a member in "Green Oaks" with:
			| memberName | Charlie Walker |
		Then the member should be created successfully in "Green Oaks"
		And the member "Charlie Walker" should belong to "Green Oaks"

	# Scenario: Update all member profile fields within a community
	# 	Given Alice creates a member in "Green Oaks" with:
	# 		| memberName | Charlie Walker |
	# 	When Alice updates member "Charlie Walker" in "Green Oaks" with:
	# 		| name             | Charles Walker                    |
	# 		| email            | charles.walker@example.com       |
	# 		| bio              | Community gardener and volunteer |
	# 		| avatarDocumentId | avatar-charles-001               |
	# 		| interests        | gardening,reading,volunteering   |
	# 		| showInterests    | true                             |
	# 		| showEmail        | true                             |
	# 		| showProfile      | true                             |
	# 		| showLocation     | false                            |
	# 		| showProperties   | true                             |
	# 	Then the member should be updated successfully in "Green Oaks"

	# @unimplemented
	# Scenario: Associate an existing end-user account to a member
	# 	Given a member "Charlie Walker" exists in "Green Oaks" with role "resident"
	# 	When Alice associates end-user account "Charlie" to member "Charlie Walker" in "Green Oaks"
	# 	Then member "Charlie Walker" should be linked to end-user account "Charlie"

	# @unimplemented
	# Scenario: List community members for owner and admin perspectives
	# 	Given Bob is an authenticated community admin for "Green Oaks"
	# 	And the following members exist in "Green Oaks":
	# 		| memberName      | role         |
	# 		| Charlie Walker  | resident     |
	# 		| Dana Ortiz      | board member |
	# 	When Bob lists members for "Green Oaks"
	# 	Then Bob should see 2 members for "Green Oaks"
	# 	And Bob should not see members from "Blue Harbor"

	# @unimplemented
	# Scenario: Filter community members by role
	# 	Given the following members exist in "Green Oaks":
	# 		| memberName      | role         |
	# 		| Charlie Walker  | resident     |
	# 		| Dana Ortiz      | board member |
	# 		| Erin Lawson     | resident     |
	# 	When Alice filters members in "Green Oaks" by role "resident"
	# 	Then Alice should see the following members in "Green Oaks":
	# 		| memberName     |
	# 		| Charlie Walker |
	# 		| Erin Lawson    |

	# @unimplemented
	# Scenario: Delete a member from a community
	# 	Given a member "Charlie Walker" exists in "Green Oaks" with role "resident"
	# 	When Alice deletes member "Charlie Walker" from "Green Oaks"
	# 	Then the member should be deleted successfully from "Green Oaks"
	# 	And member "Charlie Walker" should not appear in member listings for "Green Oaks"

	# @unimplemented
	# Scenario: Update member name while preserving existing account association
	# 	Given a member "Charlie Walker" exists in "Green Oaks" with role "resident"
	# 	And member "Charlie Walker" is already linked to end-user account "Charlie"
	# 	When Alice updates member "Charlie Walker" in "Green Oaks" with:
	# 		| memberName | Charles Walker |
	# 	Then the member should be updated successfully in "Green Oaks"
	# 	And member "Charles Walker" should be linked to end-user account "Charlie"

	# @validation @unimplemented
	# Scenario: Cannot create a member without a required name
	# 	When Alice attempts to create a member in "Green Oaks" with:
	# 		| memberName | |
	# 	Then she should see a member error for "memberName"
	# 	And no new member should be created in "Green Oaks"

	# @validation @unimplemented
	# Scenario: Cannot associate the same end-user account twice to the same member
	# 	Given a member "Charlie Walker" exists in "Green Oaks" with role "resident"
	# 	And member "Charlie Walker" is already linked to end-user account "Charlie"
	# 	When Alice associates end-user account "Charlie" to member "Charlie Walker" in "Green Oaks"
	# 	Then she should see a member error for "accountAssociation"
	# 	And member "Charlie Walker" should remain linked to end-user account "Charlie" only once