Feature: Staff user management

	As a staff administrator
	I want staff user provisioning and role management flows to be covered
	So that staff user lifecycle and permission rules are exercised consistently

	Scenario: A staff user is provisioned on first login with a default role
		Given Alice is an authenticated staff administrator
		When Alice provisions the staff user "Bob" with default role "finance"
		Then the staff user "Bob" should be created with role "finance"

	Scenario: An authorized administrator can assign another staff user's role
		Given Alice is an authenticated staff administrator
		And the staff user "Bob" exists with role "finance"
		When Alice updates the role of "Bob" to "service line owner"
		Then the role of "Bob" should be "service line owner"

	Scenario: An administrator cannot change their own role
		Given Alice is an authenticated staff administrator
		And Alice is the current staff user
		When Alice updates the role of "Alice" to "tech admin"
		Then Alice should be blocked with "self-role-change-not-allowed"

	Scenario: A restricted staff user cannot manage staff users
		Given Alice is an authenticated restricted staff user
		When Alice attempts to update the role of "Bob" to "finance"
		Then Alice should be blocked with "forbidden"

	Scenario: Activity logs capture provisioning and role assignment events
		Given Alice is an authenticated staff administrator
		And the staff user "Bob" exists with role "finance"
		When Alice updates the role of "Bob" to "service line owner"
		Then the activity log for "Bob" should include "role assigned: service line owner"

	Scenario: An authorized administrator can view the staff users list
		Given Alice is an authenticated staff administrator
		And the staff user "Bob" exists with role "finance"
		When Alice views staff users
		Then Alice should see "Bob" in the staff users list

	Scenario: An authorized administrator can view a staff user's details
		Given Alice is an authenticated staff administrator
		And the staff user "Bob" exists with role "service line owner"
		When Alice views the details for "Bob"
		Then Alice should see "service line owner" in the staff user details
