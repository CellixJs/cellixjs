Feature: <DomainAdapter> EndUserRoleDomainAdapter

  Background:
    Given a valid Mongoose EndUserRole document with roleName "Test Role", isDefault true, populated community field, and permissions

  Scenario: Getting and setting the roleName property
    Given an EndUserRoleDomainAdapter for the document
    When I get the roleName property
    Then it should return "Test Role"
    When I set the roleName property to "New Role Name"
    Then the document's roleName should be "New Role Name"

  Scenario: Getting and setting the isDefault property
    Given an EndUserRoleDomainAdapter for the document
    When I get the isDefault property
    Then it should return true
    When I set the isDefault property to false
    Then the document's isDefault should be false

  Scenario: Getting the community property when populated
    Given an EndUserRoleDomainAdapter for the document
    When I get the community property
    Then it should return a CommunityDomainAdapter instance with the correct community data

  Scenario: Getting the community property when not populated
    Given an EndUserRoleDomainAdapter for a document with community as an ObjectId
    When I get the community property
    Then an error should be thrown indicating "community is not populated or is not of the correct type"

  Scenario: Setting the community property with a valid Community domain object
    Given an EndUserRoleDomainAdapter for the document
    And a valid Community domain object
    When I set the community property to the Community domain object
    Then the document's community should be set to the community's doc

  Scenario: Setting the community property with an invalid value
    Given an EndUserRoleDomainAdapter for the document
    And an object that is not a Community domain object
    When I try to set the community property to the invalid object
    Then an error should be thrown indicating "community reference is missing id"

  Scenario: Getting the permissions property
    Given an EndUserRoleDomainAdapter for the document
    When I get the permissions property
    Then it should return an EndUserRolePermissionsDomainAdapter instance

  Scenario: Getting the roleType property
    Given an EndUserRoleDomainAdapter for the document
    When I get the roleType property
    Then it should return the expected role type

  Scenario: EndUserRolePermissionsDomainAdapter getting communityPermissions property
    Given an EndUserRolePermissionsDomainAdapter for a permissions document
    When I get the communityPermissions property
    Then it should return an EndUserRoleCommunityPermissionsDomainAdapter instance

  Scenario: EndUserRolePermissionsDomainAdapter getting propertyPermissions property
    Given an EndUserRolePermissionsDomainAdapter for a permissions document
    When I get the propertyPermissions property
    Then it should return an EndUserRolePropertyPermissionsDomainAdapter instance

  Scenario: EndUserRolePermissionsDomainAdapter getting serviceTicketPermissions property
    Given an EndUserRolePermissionsDomainAdapter for a permissions document
    When I get the serviceTicketPermissions property
    Then it should return an EndUserRoleServiceTicketPermissionsDomainAdapter instance

  Scenario: EndUserRolePermissionsDomainAdapter getting servicePermissions property
    Given an EndUserRolePermissionsDomainAdapter for a permissions document
    When I get the servicePermissions property
    Then it should return an EndUserRoleServicePermissionsDomainAdapter instance

  Scenario: EndUserRolePermissionsDomainAdapter getting violationTicketPermissions property
    Given an EndUserRolePermissionsDomainAdapter for a permissions document
    When I get the violationTicketPermissions property
    Then it should return an EndUserRoleViolationTicketPermissionsDomainAdapter instance

  Scenario: EndUserRoleCommunityPermissionsDomainAdapter getting and setting canManageEndUserRolesAndPermissions property
    Given an EndUserRoleCommunityPermissionsDomainAdapter for a community permissions document
    When I get the canManageEndUserRolesAndPermissions property
    Then it should return true
    When I set the canManageEndUserRolesAndPermissions property to false
    Then the document's canManageRolesAndPermissions should be false

  Scenario: EndUserRoleCommunityPermissionsDomainAdapter getting and setting canManageCommunitySettings property
    Given an EndUserRoleCommunityPermissionsDomainAdapter for a community permissions document
    When I get the canManageCommunitySettings property
    Then it should return true
    When I set the canManageCommunitySettings property to false
    Then the document's canManageCommunitySettings should be false

  Scenario: EndUserRoleCommunityPermissionsDomainAdapter getting and setting canManageSiteContent property
    Given an EndUserRoleCommunityPermissionsDomainAdapter for a community permissions document
    When I get the canManageSiteContent property
    Then it should return true
    When I set the canManageSiteContent property to false
    Then the document's canManageSiteContent should be false

  Scenario: EndUserRoleCommunityPermissionsDomainAdapter getting and setting canManageMembers property
    Given an EndUserRoleCommunityPermissionsDomainAdapter for a community permissions document
    When I get the canManageMembers property
    Then it should return true
    When I set the canManageMembers property to false
    Then the document's canManageMembers should be false

  Scenario: EndUserRoleCommunityPermissionsDomainAdapter getting and setting canEditOwnMemberProfile property
    Given an EndUserRoleCommunityPermissionsDomainAdapter for a community permissions document
    When I get the canEditOwnMemberProfile property
    Then it should return true
    When I set the canEditOwnMemberProfile property to false
    Then the document's canEditOwnMemberProfile should be false

  Scenario: EndUserRoleCommunityPermissionsDomainAdapter getting and setting canEditOwnMemberAccounts property
    Given an EndUserRoleCommunityPermissionsDomainAdapter for a community permissions document
    When I get the canEditOwnMemberAccounts property
    Then it should return true
    When I set the canEditOwnMemberAccounts property to false
    Then the document's canEditOwnMemberAccounts should be false

  Scenario: EndUserRolePropertyPermissionsDomainAdapter getting and setting canManageProperties property
    Given an EndUserRolePropertyPermissionsDomainAdapter for a property permissions document
    When I get the canManageProperties property
    Then it should return true
    When I set the canManageProperties property to false
    Then the document's canManageProperties should be false

  Scenario: EndUserRolePropertyPermissionsDomainAdapter getting and setting canEditOwnProperty property
    Given an EndUserRolePropertyPermissionsDomainAdapter for a property permissions document
    When I get the canEditOwnProperty property
    Then it should return true
    When I set the canEditOwnProperty property to false
    Then the document's canEditOwnProperty should be false

  Scenario: EndUserRoleServicePermissionsDomainAdapter getting and setting canManageServices property
    Given an EndUserRoleServicePermissionsDomainAdapter for a service permissions document
    When I get the canManageServices property
    Then it should return true
    When I set the canManageServices property to false
    Then the document's canManageServices should be false

  Scenario: EndUserRoleServiceTicketPermissionsDomainAdapter getting and setting canCreateTickets property
    Given an EndUserRoleServiceTicketPermissionsDomainAdapter for a service ticket permissions document
    When I get the canCreateTickets property
    Then it should return true
    When I set the canCreateTickets property to false
    Then the document's canCreateTickets should be false

  Scenario: EndUserRoleServiceTicketPermissionsDomainAdapter getting and setting canManageTickets property
    Given an EndUserRoleServiceTicketPermissionsDomainAdapter for a service ticket permissions document
    When I get the canManageTickets property
    Then it should return true
    When I set the canManageTickets property to false
    Then the document's canManageTickets should be false

  Scenario: EndUserRoleServiceTicketPermissionsDomainAdapter getting and setting canAssignTickets property
    Given an EndUserRoleServiceTicketPermissionsDomainAdapter for a service ticket permissions document
    When I get the canAssignTickets property
    Then it should return true
    When I set the canAssignTickets property to false
    Then the document's canAssignTickets should be false

  Scenario: EndUserRoleServiceTicketPermissionsDomainAdapter getting and setting canWorkOnTickets property
    Given an EndUserRoleServiceTicketPermissionsDomainAdapter for a service ticket permissions document
    When I get the canWorkOnTickets property
    Then it should return true
    When I set the canWorkOnTickets property to false
    Then the document's canWorkOnTickets should be false

  Scenario: EndUserRoleViolationTicketPermissionsDomainAdapter getting and setting canCreateTickets property
    Given an EndUserRoleViolationTicketPermissionsDomainAdapter for a violation ticket permissions document
    When I get the canCreateTickets property
    Then it should return true
    When I set the canCreateTickets property to false
    Then the document's canCreateTickets should be false

  Scenario: EndUserRoleViolationTicketPermissionsDomainAdapter getting and setting canManageTickets property
    Given an EndUserRoleViolationTicketPermissionsDomainAdapter for a violation ticket permissions document
    When I get the canManageTickets property
    Then it should return true
    When I set the canManageTickets property to false
    Then the document's canManageTickets should be false

  Scenario: EndUserRoleViolationTicketPermissionsDomainAdapter getting and setting canAssignTickets property
    Given an EndUserRoleViolationTicketPermissionsDomainAdapter for a violation ticket permissions document
    When I get the canAssignTickets property
    Then it should return true
    When I set the canAssignTickets property to false
    Then the document's canAssignTickets should be false

  Scenario: EndUserRoleViolationTicketPermissionsDomainAdapter getting and setting canWorkOnTickets property
    Given an EndUserRoleViolationTicketPermissionsDomainAdapter for a violation ticket permissions document
    When I get the canWorkOnTickets property
    Then it should return true
    When I set the canWorkOnTickets property to false
    Then the document's canWorkOnTickets should be false