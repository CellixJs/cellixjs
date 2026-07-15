Feature: Community member management

	As a community owner or administrator
	I want to manage members within a specific community
	So that member records and account access remain accurate and correctly scoped

	Background:
		Given Alice is signed in as a community owner for member management
		And Alice has a community named "Green Oaks"
		And Alice has a community named "Blue Harbor"

	Scenario: Create a member record in a community
		When Alice creates a member in "Green Oaks" with:
			| memberName | Charlie Walker |
		Then the member should be created successfully in "Green Oaks"

	Scenario: Update all member profile fields within a community
		Given Alice creates a member in "Green Oaks" with:
			| memberName | Charlie Walker |
		When Alice updates member "Charlie Walker" in "Green Oaks" with:
			| name             | Charles Walker                    |
			| email            | charles.walker@example.com       |
			| bio              | Community gardener and volunteer |
			| avatarDocumentId | avatar-charles-001               |
			| interests        | gardening,reading,volunteering   |
			| showInterests    | true                             |
			| showEmail        | true                             |
			| showProfile      | true                             |
			| showLocation     | false                            |
			| showProperties   | true                             |
		Then the member should be updated successfully in "Green Oaks"

	Scenario: Assign a community end-user account to a member
		Given Alice creates a member in "Green Oaks" with:
			| memberName | Charlie Walker |
		And end-user account "Charlie" is available for assignment in "Green Oaks"
		When Alice associates end-user account "Charlie" to member "Charlie Walker" in "Green Oaks"
		Then member "Charlie Walker" should be linked to end-user account "Charlie"

	Scenario: Update a member role with a role from the same community
		Given Alice creates a member in "Green Oaks" with:
			| memberName | Charlie Walker |
		And a role "board member" exists in "Green Oaks"
		When Alice changes member "Charlie Walker" in "Green Oaks" to role "board member"
		Then member "Charlie Walker" should have role "board member" in "Green Oaks"

	@validation
	Scenario: Cannot assign a role from another community
		Given Alice creates a member in "Green Oaks" with:
			| memberName | Charlie Walker |
		And a role "harbor board member" exists in "Blue Harbor"
		When Alice attempts to change member "Charlie Walker" in "Green Oaks" to role "harbor board member"
		Then she should see a member error for "role"
		And member "Charlie Walker" should not have role "harbor board member" in "Green Oaks"

	Scenario: List members as a community administrator
		Given Bob is an authenticated community admin for "Green Oaks"
		And the following members exist in "Green Oaks":
			| memberName     |
			| Charlie Walker |
			| Dana Ortiz     |
		And Alice creates a member in "Blue Harbor" with:
			| memberName | Erin Lawson |
		When Bob lists members for "Green Oaks"
		Then Bob should see the following members in "Green Oaks":
			| memberName     |
			| Charlie Walker |
			| Dana Ortiz     |
		And Bob should not see member "Erin Lawson" from "Blue Harbor"

	Scenario: Filter the community member list by member name
		Given the following members exist in "Green Oaks":
			| memberName     |
			| Charlie Walker |
			| Dana Ortiz     |
			| Charlotte Webb |
		When Alice searches the member list in "Green Oaks" for "Charlie"
		Then Alice should see the following members in "Green Oaks":
			| memberName     |
			| Charlie Walker |
		And Alice should not see member "Dana Ortiz" in the filtered results

	Scenario: Remove a member from a community
		Given Alice creates a member in "Green Oaks" with:
			| memberName | Charlie Walker |
		When Alice removes member "Charlie Walker" from "Green Oaks"
		Then the member should be removed successfully from "Green Oaks"
		And member "Charlie Walker" should not appear in member listings for "Green Oaks"

	@validation
	Scenario: Cannot create a member without a required name
		When Alice attempts to create a member in "Green Oaks" with:
			| memberName | |
		Then she should see a member error for "memberName"
		And no new member should be created in "Green Oaks"

	@validation
	Scenario: Cannot associate the same end-user account twice to the same member
		Given Alice creates a member in "Green Oaks" with:
			| memberName | Charlie Walker |
		And end-user account "Charlie" is available for assignment in "Green Oaks"
		And member "Charlie Walker" is already linked to end-user account "Charlie"
		When Alice associates end-user account "Charlie" to member "Charlie Walker" in "Green Oaks"
		Then she should see a member error for "accountAssociation"
		And member "Charlie Walker" should remain linked to end-user account "Charlie" only once

	@authorization
	Scenario: An end user without community membership cannot remove a member
		Given Alice creates a member in "Green Oaks" with:
			| memberName | Charlie Walker |
		And Evan is signed in without membership in "Green Oaks"
		When Evan attempts to remove member "Charlie Walker" from "Green Oaks"
		Then Evan should receive an authorization error for member management
		And member "Charlie Walker" should remain in "Green Oaks"

	# @unimplemented
	# Scenario: A single end-user account can belong to multiple communities
	# 	Given Alice creates a member in "Green Oaks" with:
	# 		| memberName | Charlie Walker |
	# 	And Alice creates a member in "Blue Harbor" with:
	# 		| memberName | Charles Walker |
	# 	And end-user account "Charlie" is available for assignment in "Green Oaks"
	# 	And end-user account "Charlie" is available for assignment in "Blue Harbor"
	# 	When Alice associates end-user account "Charlie" to member "Charlie Walker" in "Green Oaks"
	# 	And Alice associates end-user account "Charlie" to member "Charles Walker" in "Blue Harbor"
	# 	Then end-user account "Charlie" should be linked to member "Charlie Walker" in "Green Oaks"
	# 	And end-user account "Charlie" should be linked to member "Charles Walker" in "Blue Harbor"
	# 	And each member association should remain scoped to its own community