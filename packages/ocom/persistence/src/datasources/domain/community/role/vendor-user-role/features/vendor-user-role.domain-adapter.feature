Feature: VendorUserRole Domain Adapter

  Background:
    Given a VendorUserRole document with populated community

  Scenario: Accessing roleName property
    When I access the roleName property
    Then I should get "Test Vendor Role"

  Scenario: Accessing isDefault property
    When I access the isDefault property
    Then I should get true

  Scenario: Accessing permissions property
    When I access the permissions property
    Then I should get a VendorUserRolePermissionsDomainAdapter instance

  Scenario: Accessing roleType property
    When I access the roleType property
    Then I should get "vendor-user-role"

  Scenario: Accessing community property
    When I access the community property
    Then I should get a Community domain adapter instance

  Scenario: Accessing specific permission
    When I access permissions.communityPermissions.canManageVendorUserRolesAndPermissions
    Then I should get true

  Scenario: Accessing property permissions
    When I access permissions.propertyPermissions.canManageProperties
    Then I should get true

  Scenario: Accessing canManageCommunitySettings
    When I access permissions.communityPermissions.canManageCommunitySettings
    Then I should get true

  Scenario: Accessing canEditOwnProperty
    When I access permissions.propertyPermissions.canEditOwnProperty
    Then I should get true

  Scenario: Accessing canManageServices
    When I access permissions.servicePermissions.canManageServices
    Then I should get true

  Scenario: Accessing canCreateTickets for service tickets
    When I access permissions.serviceTicketPermissions.canCreateTickets
    Then I should get true

  Scenario: Setting roleName property
    When I set the roleName to "Updated Role Name"
    Then the roleName should be "Updated Role Name"

  Scenario: Setting canManageVendorUserRolesAndPermissions
    When I set permissions.communityPermissions.canManageVendorUserRolesAndPermissions to false
    Then permissions.communityPermissions.canManageVendorUserRolesAndPermissions should be false

  Scenario: Accessing canManageSiteContent
    When I access permissions.communityPermissions.canManageSiteContent
    Then I should get true

  Scenario: Accessing canManageMembers
    When I access permissions.communityPermissions.canManageMembers
    Then I should get true

  Scenario: Accessing canManageTickets for service tickets
    When I access permissions.serviceTicketPermissions.canManageTickets
    Then I should get true

  Scenario: Accessing canCreateTickets for violation tickets
    When I access permissions.violationTicketPermissions.canCreateTickets
    Then I should get true

  Scenario: Setting canManageServices
    When I set permissions.servicePermissions.canManageServices to false
    Then permissions.servicePermissions.canManageServices should be false

  Scenario: Accessing canAssignTickets for service tickets
    When I access permissions.serviceTicketPermissions.canAssignTickets
    Then I should get true

  Scenario: Accessing canWorkOnTickets for service tickets
    When I access permissions.serviceTicketPermissions.canWorkOnTickets
    Then I should get true

  Scenario: Accessing canAssignTickets for violation tickets
    When I access permissions.violationTicketPermissions.canAssignTickets
    Then I should get true

  Scenario: Accessing canWorkOnTickets for violation tickets
    When I access permissions.violationTicketPermissions.canWorkOnTickets
    Then I should get true

  Scenario: Setting canAssignTickets for service tickets
    When I set permissions.serviceTicketPermissions.canAssignTickets to false
    Then permissions.serviceTicketPermissions.canAssignTickets should be false

  Scenario: Setting canWorkOnTickets for service tickets
    When I set permissions.serviceTicketPermissions.canWorkOnTickets to false
    Then permissions.serviceTicketPermissions.canWorkOnTickets should be false

  Scenario: Setting canAssignTickets for violation tickets
    When I set permissions.violationTicketPermissions.canAssignTickets to false
    Then permissions.violationTicketPermissions.canAssignTickets should be false

  Scenario: Setting canWorkOnTickets for violation tickets
    When I set permissions.violationTicketPermissions.canWorkOnTickets to false
    Then permissions.violationTicketPermissions.canWorkOnTickets should be false

  Scenario: Setting canManageProperties
    When I set permissions.propertyPermissions.canManageProperties to false
    Then permissions.propertyPermissions.canManageProperties should be false

  Scenario: Setting canEditOwnProperty
    When I set permissions.propertyPermissions.canEditOwnProperty to false
    Then permissions.propertyPermissions.canEditOwnProperty should be false

  Scenario: Setting canManageCommunitySettings
    When I set permissions.communityPermissions.canManageCommunitySettings to false
    Then permissions.communityPermissions.canManageCommunitySettings should be false

  Scenario: Setting canManageSiteContent
    When I set permissions.communityPermissions.canManageSiteContent to false
    Then permissions.communityPermissions.canManageSiteContent should be false

  Scenario: Setting canManageMembers
    When I set permissions.communityPermissions.canManageMembers to false
    Then permissions.communityPermissions.canManageMembers should be false

  Scenario: Setting canEditOwnMemberProfile
    When I set permissions.communityPermissions.canEditOwnMemberProfile to false
    Then permissions.communityPermissions.canEditOwnMemberProfile should be false

  Scenario: Setting canEditOwnMemberAccounts
    When I set permissions.communityPermissions.canEditOwnMemberAccounts to false
    Then permissions.communityPermissions.canEditOwnMemberAccounts should be false

  Scenario: Setting isDefault property
    When I set the isDefault to false
    Then the isDefault should be false