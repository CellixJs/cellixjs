Feature: Staff role management

	As a staff administrator
	I want to create, view, update, and assign staff roles with granular permissions
	So that staff members only have access to the operations their role allows

	Scenario: View the list of staff roles
		Given Alice is an authenticated "tech admin" staff user
		When Alice views the staff roles list
		Then the staff roles list should include the default staff roles

	@skip-e2e
	Scenario: View staff role details
		Given Alice is an authenticated "tech admin" staff user
		And a staff role named "Seeded Case Manager" exists
		When Alice views the details of the staff role "Seeded Case Manager"
		Then she should see the staff role name "Seeded Case Manager"
		And she should see the enterprise app role "Staff.CaseManager"

	Scenario: Create a staff role with basic details
		Given Alice is an authenticated "tech admin" staff user
		When Alice creates a staff role with:
			| roleName          | Support Agent     |
			| enterpriseAppRole | Staff.CaseManager |
		Then the staff role should be created successfully
		And the staff roles list should include "Support Agent"

	@skip-ui
	Scenario: Create a staff role with granted permissions
		Given Alice is an authenticated "tech admin" staff user
		When Alice creates a staff role named "Audit Reviewer" with permissions:
			| canViewRoles      | true |
			| canViewStaffUsers | true |
		Then the staff role should be created successfully
		And the staff role "Audit Reviewer" should have the permission "canViewRoles" granted
		And the staff role "Audit Reviewer" should have the permission "canViewStaffUsers" granted

	Scenario: Rename an existing staff role
		Given Alice is an authenticated "tech admin" staff user
		And a staff role named "Field Coordinator" exists
		When Alice renames the staff role "Field Coordinator" to "Regional Coordinator"
		Then the staff role should be updated successfully
		And the staff roles list should include "Regional Coordinator"

	@skip-ui
	Scenario: Update permissions on an existing staff role
		Given Alice is an authenticated "tech admin" staff user
		And a staff role named "Intake Specialist" exists
		When Alice grants the permission "canAssignStaffRoles" to the staff role "Intake Specialist"
		Then the staff role should be updated successfully
		And the staff role "Intake Specialist" should have the permission "canAssignStaffRoles" granted

	@api-only
	Scenario: Assign a staff role to a staff user
		Given Alice is an authenticated "tech admin" staff user
		And a staff role named "Seeded Tech Admin" exists
		When Alice assigns the staff role "Seeded Tech Admin" to the staff user "Staff User"
		Then the staff user "Staff User" should have the staff role "Seeded Tech Admin"

	@validation
	Scenario: Cannot create a duplicate staff role
		Given Alice is an authenticated "tech admin" staff user
		And a staff role named "Billing Clerk" exists
		When Alice attempts to create a staff role with:
			| roleName          | Billing Clerk     |
			| enterpriseAppRole | Staff.CaseManager |
		Then she should see a staff role error containing "already exists"
		And no additional staff role should be created

	@validation
	Scenario: Cannot create a staff role without a name
		Given Alice is an authenticated "tech admin" staff user
		When Alice attempts to create a staff role with:
			| roleName | |
		Then she should see a staff role validation error for "roleName"
		And no additional staff role should be created

	@api-only
	Scenario: Case manager cannot create a role for a higher privileged enterprise app role
		Given Alice is an authenticated "case manager" staff user
		When Alice attempts to create a staff role with:
			| roleName          | Elevated Role   |
			| enterpriseAppRole | Staff.TechAdmin |
		Then she should see a staff role error containing "do not have permission"
		And no additional staff role should be created

	@api-only
	Scenario: Unauthenticated users cannot view staff roles
		Given Alice is not authenticated
		When Alice attempts to view the staff roles list
		Then the staff roles request should be rejected as unauthorized

	@skip-api
	Scenario: Staff user without role permissions cannot open the roles screen
		Given Alice is an authenticated "case manager" staff user
		When Alice opens the staff roles screen
		Then Alice should be directed to "/unauthorized"

	@ui-only
	Scenario: Staff user with only the view-roles permission can see but not manage roles
		Given Alice is an authenticated staff user with only the "canViewRoles" role permission
		When Alice views the staff roles list
		Then the staff roles list should include the default staff roles
		And she should not see an option to create a staff role
		And she should not see an option to edit a staff role

	@ui-only
	Scenario: Staff user with only the add-role permission can create a staff role
		Given Alice is an authenticated staff user with only the "canAddRole" role permission
		When Alice creates a staff role with:
			| roleName          | Junior Auditor    |
			| enterpriseAppRole | Staff.CaseManager |
		Then the staff role should be created successfully
		And the staff roles list should include "Junior Auditor"

	@ui-only
	Scenario: Staff user with only the edit-role permission can rename a staff role
		Given Alice is an authenticated staff user with only the "canEditRole" role permission
		And a staff role named "Legacy Coordinator" exists
		When Alice renames the staff role "Legacy Coordinator" to "Modern Coordinator"
		Then the staff role should be updated successfully
		And the staff roles list should include "Modern Coordinator"

	@ui-only
	Scenario: Staff user without the edit-role permission cannot open the edit screen
		Given Alice is an authenticated staff user with only the "canViewRoles" role permission
		And a staff role named "Restricted Role" exists
		When Alice opens the edit screen for the staff role "Restricted Role"
		Then Alice should be directed to "/unauthorized"

	Scenario: Delete a non-default staff role
		Given Alice is an authenticated "tech admin" staff user
		And a staff role named "Obsolete Coordinator" exists
		When Alice deletes the staff role "Obsolete Coordinator"
		Then the staff role should be deleted successfully
		And the staff roles list should not include "Obsolete Coordinator"

	@skip-ui
	Scenario: Deleting a staff role reassigns its staff users to the matching default role
		Given Alice is an authenticated "tech admin" staff user
		And a staff role named "Interim Case Manager" exists
		And Alice assigns the staff role "Interim Case Manager" to the staff user "Staff User"
		When Alice deletes the staff role "Interim Case Manager"
		Then the staff role should be deleted successfully
		And the staff user "Staff User" should have the staff role "Default Case Manager"

	@api-only
	Scenario: Default staff roles cannot be deleted
		Given Alice is an authenticated "tech admin" staff user
		And a staff role named "Default Case Manager" exists
		When Alice attempts to delete the staff role "Default Case Manager"
		Then she should see a staff role error containing "default"
		And the staff roles list should include "Default Case Manager"

	@skip-api
	Scenario: The delete action is not available for a default staff role
		Given Alice is an authenticated "tech admin" staff user
		And a staff role named "Default Case Manager" exists
		When Alice views the details of the staff role "Default Case Manager"
		Then she should not see a delete action for the staff role

	@api-only
	Scenario: Staff user without the remove-role permission cannot delete a staff role
		Given Alice is an authenticated "case manager" staff user
		And a staff role named "Seeded Case Manager" exists
		When Alice attempts to delete the staff role "Seeded Case Manager"
		Then she should see a staff role error containing "do not have permission"
		And the staff roles list should include "Seeded Case Manager"

	@ui-only
	Scenario: Staff user without the remove-role permission sees no delete action
		Given Alice is an authenticated staff user with only the "canEditRole" role permission
		And a staff role named "Guarded Role" exists
		When Alice views the details of the staff role "Guarded Role"
		Then she should not see a delete action for the staff role

	@ui-only
	Scenario: Staff user with only the remove-role permission can delete a staff role
		Given Alice is an authenticated staff user with only the "canRemoveRole" role permission
		And a staff role named "Remove Only Role" exists
		When Alice deletes the staff role "Remove Only Role"
		Then the staff roles list should not include "Remove Only Role"

	@skip-api
	Scenario: Cancelling the delete confirmation leaves the staff role intact
		Given Alice is an authenticated "tech admin" staff user
		And a staff role named "Retained Role" exists
		When Alice starts deleting the staff role "Retained Role"
		Then she should see a delete confirmation explaining assigned staff users will be reassigned
		When Alice cancels the staff role deletion
		And Alice views the staff roles list
		Then the staff roles list should include "Retained Role"

	@ui-only
	Scenario: Deletion failure keeps the staff role and shows an error
		Given Alice is an authenticated "tech admin" staff user
		And a staff role named "Resilient Role" exists
		And the staff role deletion will fail
		When Alice attempts to delete the staff role "Resilient Role"
		Then she should see a staff role error containing "Failed to delete"
		When Alice views the staff roles list
		Then the staff roles list should include "Resilient Role"
