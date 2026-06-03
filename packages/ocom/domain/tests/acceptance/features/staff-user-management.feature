@staff-user @e2e
Feature: Staff User Management End-to-End Flow
	As a staff user administrator
	I want new staff users to be created with the correct default role
	So that permissions stay consistent

	Background:
		Given I am an authorized staff user administrator
		And a staff user blueprint is prepared without an assigned role

	Scenario: Create a staff user
		When I create the staff user
		Then the staff user should be created successfully
		And the staff user should have no default role assigned yet

	Scenario Outline: Assign the <defaultRole> default role to a staff user
		When I create the staff user
		And I assign the default staff role "<defaultRole>"
		Then the assigned role name should be "<expectedRoleName>"
		And the assigned role enterprise app role should be "<expectedEnterpriseAppRole>"
		And the assigned role should be default
		And the assigned role permissions should be communities <canManageCommunities>, staff roles <canManageStaffRolesAndPermissions>, finance <canManageFinance>, tech admin <canManageTechAdmin>, users <canManageUsers>
		And the staff user should expose the assigned role

		Examples:
			| defaultRole        | expectedRoleName             | expectedEnterpriseAppRole | canManageCommunities | canManageStaffRolesAndPermissions | canManageFinance | canManageTechAdmin | canManageUsers |
			| case manager       | Default Case Manager         | Staff.CaseManager         | true                 | false                             | false            | false              | true           |
			| service line owner | Default Service Line Owner   | Staff.ServiceLineOwner    | true                 | false                             | false            | false              | true           |
			| finance            | Default Finance              | Staff.Finance             | false                | false                             | true             | false              | false          |
			| tech admin         | Default Tech Admin           | Staff.TechAdmin           | true                 | true                              | true             | true               | true           |
