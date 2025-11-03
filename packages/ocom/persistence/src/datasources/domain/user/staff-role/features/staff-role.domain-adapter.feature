Feature: <DomainAdapter> StaffRoleDomainAdapter

  Background:
    Given a valid Mongoose StaffRole document with roleName "Manager", isDefault false, and roleType "staff"

  Scenario: Getting the roleName property
    Given a StaffRoleDomainAdapter for the document
    When I get the roleName property
    Then it should return "Manager"

  Scenario: Getting and setting the roleName property
    Given a StaffRoleDomainAdapter for the document
    When I set the roleName property to "Supervisor"
    Then the document's roleName should be "Supervisor"

  Scenario: Getting the isDefault property
    Given a StaffRoleDomainAdapter for the document
    When I get the isDefault property
    Then it should return false

  Scenario: Getting and setting the isDefault property
    Given a StaffRoleDomainAdapter for the document
    When I set the isDefault property to true
    Then the document's isDefault should be true

  Scenario: Getting the roleType property
    Given a StaffRoleDomainAdapter for the document
    When I get the roleType property
    Then it should return "staff"

  Scenario: Getting the permissions property
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    Then it should return a StaffRolePermissionsAdapter instance

  Scenario: Getting communityPermissions from permissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the communityPermissions property
    Then it should return a StaffRoleCommunityPermissionsAdapter instance

  Scenario: Getting and setting canManageStaffRolesAndPermissions from communityPermissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the communityPermissions property
    And I get the canManageStaffRolesAndPermissions property
    Then it should return false
    When I set the canManageStaffRolesAndPermissions property to true
    Then the communityPermissions' canManageStaffRolesAndPermissions should be true

  Scenario: Getting and setting canManageAllCommunities from communityPermissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the communityPermissions property
    And I get the canManageAllCommunities property
    Then it should return false
    When I set the canManageAllCommunities property to true
    Then the communityPermissions' canManageAllCommunities should be true

  Scenario: Getting and setting canDeleteCommunities from communityPermissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the communityPermissions property
    And I get the canDeleteCommunities property
    Then it should return false
    When I set the canDeleteCommunities property to true
    Then the communityPermissions' canDeleteCommunities should be true

  Scenario: Getting and setting canChangeCommunityOwner from communityPermissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the communityPermissions property
    And I get the canChangeCommunityOwner property
    Then it should return false
    When I set the canChangeCommunityOwner property to true
    Then the communityPermissions' canChangeCommunityOwner should be true

  Scenario: Getting and setting canReIndexSearchCollections from communityPermissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the communityPermissions property
    And I get the canReIndexSearchCollections property
    Then it should return false
    When I set the canReIndexSearchCollections property to true
    Then the communityPermissions' canReIndexSearchCollections should be true

  Scenario: Getting propertyPermissions from permissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the propertyPermissions property
    Then it should return a StaffRolePropertyPermissionsAdapter instance

  Scenario: Getting and setting canManageProperties from propertyPermissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the propertyPermissions property
    And I get the canManageProperties property
    Then it should return false
    When I set the canManageProperties property to true
    Then the propertyPermissions' canManageProperties should be true

  Scenario: Getting and setting canEditOwnProperty from propertyPermissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the propertyPermissions property
    And I get the canEditOwnProperty property
    Then it should return false
    When I set the canEditOwnProperty property to true
    Then the propertyPermissions' canEditOwnProperty should be true

  Scenario: Getting servicePermissions from permissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the servicePermissions property
    Then it should return a StaffRoleServicePermissionsAdapter instance

  Scenario: Getting canManageServices from servicePermissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the servicePermissions property
    And I get the canManageServices property
    Then it should return false

  Scenario: Getting serviceTicketPermissions from permissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the serviceTicketPermissions property
    Then it should return a StaffRoleServiceTicketPermissionsAdapter instance

  Scenario: Getting ticket permissions from serviceTicketPermissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the serviceTicketPermissions property
    Then the canCreateTickets property should return false
    And the canManageTickets property should return false
    And the canAssignTickets property should return false
    And the canWorkOnTickets property should return false

  Scenario: Getting violationTicketPermissions from permissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the violationTicketPermissions property
    Then it should return a StaffRoleViolationTicketPermissionsAdapter instance

  Scenario: Getting and setting violation ticket permissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the violationTicketPermissions property
    Then the canCreateTickets property should return false
    And the canManageTickets property should return false
    And the canAssignTickets property should return false
    And the canWorkOnTickets property should return false
    When I set the canCreateTickets property to true
    Then the violationTicketPermissions' canCreateTickets should be true