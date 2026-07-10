Feature: Community member authorization and scope boundaries

	As a community owner or administrator
	I want member actions to respect authorization and community scope boundaries
	So that only permitted users can act and shared end-user accounts remain correctly scoped per community

	Background:
		Given Alice is signed in as a community owner for member management
		And Alice has a community named "Green Oaks"
		And Alice has a community named "Blue Harbor"
		And Charlie is an existing end-user account

	# @authorization @unimplemented
	# Scenario: Unauthorized actor cannot manage community members
	# 	Given Evan is an authenticated end-user without member-management permission in "Green Oaks"
	# 	When Evan attempts to delete member "Charlie Walker" from "Green Oaks"
	# 	Then Evan should receive an authorization error for member management
	# 	And member "Charlie Walker" should remain in "Green Oaks"

	# @unimplemented
	# Scenario: A single end-user account can belong to multiple communities
	# 	Given a member "Charlie Walker" exists in "Green Oaks" with role "resident"
	# 	And a member "Charlie Walker" exists in "Blue Harbor" with role "resident"
	# 	When Alice associates end-user account "Charlie" to member "Charlie Walker" in "Green Oaks"
	# 	And Alice associates end-user account "Charlie" to member "Charlie Walker" in "Blue Harbor"
	# 	Then end-user account "Charlie" should be linked to a member in "Green Oaks"
	# 	And end-user account "Charlie" should be linked to a member in "Blue Harbor"
	# 	And each member association should remain scoped to its own community