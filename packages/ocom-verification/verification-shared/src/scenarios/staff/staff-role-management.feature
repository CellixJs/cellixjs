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
