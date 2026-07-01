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

  Scenario: Setting the roleName updates the enterpriseAppRole
    Given a StaffRoleDomainAdapter for the document
    When I set the roleName property to "Supervisor"
    Then the document's enterpriseAppRole should be "Supervisor"

  Scenario: Getting the enterpriseAppRole property
    Given a StaffRoleDomainAdapter for the document with enterpriseAppRole "Staff.Manager"
    When I get the enterpriseAppRole property
    Then it should return "Staff.Manager"

  Scenario: Getting the enterpriseAppRole property when missing
    Given a StaffRoleDomainAdapter for the document with no enterpriseAppRole
    When I get the enterpriseAppRole property
    Then it should return ""

  Scenario: Setting the enterpriseAppRole property
    Given a StaffRoleDomainAdapter for the document
    When I set the enterpriseAppRole property to "Staff.Supervisor"
    Then the document's enterpriseAppRole should be "Staff.Supervisor"

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

  Scenario: Getting and setting canManageCommunities from communityPermissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the communityPermissions property
    And I get the canManageCommunities property
    Then it should return false
    When I set the canManageCommunities property to true
    Then the communityPermissions' canManageCommunities should be true

  Scenario: Getting financePermissions from permissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the financePermissions property
    Then it should return a StaffRoleFinancePermissionsAdapter instance

  Scenario: Getting and setting canManageFinance from financePermissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the financePermissions property
    Then the canManageFinance property should return false
    When I set the canManageFinance property to true
    Then the financePermissions' canManageFinance should be true

  Scenario: Getting and setting canViewGLBatchSummaries from financePermissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the financePermissions property
    Then the canViewGLBatchSummaries property should return false
    When I set the canViewGLBatchSummaries property to true
    Then the financePermissions' canViewGLBatchSummaries should be true

  Scenario: Getting and setting canViewFinanceConfigs from financePermissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the financePermissions property
    Then the canViewFinanceConfigs property should return false
    When I set the canViewFinanceConfigs property to true
    Then the financePermissions' canViewFinanceConfigs should be true

  Scenario: Getting and setting canCreateFinanceConfigs from financePermissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the financePermissions property
    Then the canCreateFinanceConfigs property should return false
    When I set the canCreateFinanceConfigs property to true
    Then the financePermissions' canCreateFinanceConfigs should be true

  Scenario: Getting techAdminPermissions from permissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the techAdminPermissions property
    Then it should return a StaffRoleTechAdminPermissionsAdapter instance

  Scenario: Getting and setting canManageTechAdmin from techAdminPermissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the techAdminPermissions property
    Then the canManageTechAdmin property should return false
    When I set the canManageTechAdmin property to true
    Then the techAdminPermissions' canManageTechAdmin should be true

  Scenario: Getting and setting canViewDatabaseDocuments from techAdminPermissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the techAdminPermissions property
    Then the canViewDatabaseDocuments property should return false
    When I set the canViewDatabaseDocuments property to true
    Then the techAdminPermissions' canViewDatabaseDocuments should be true

  Scenario: Getting and setting canViewBlobExplorer from techAdminPermissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the techAdminPermissions property
    Then the canViewBlobExplorer property should return false
    When I set the canViewBlobExplorer property to true
    Then the techAdminPermissions' canViewBlobExplorer should be true

  Scenario: Getting and setting canViewQueueDashboard from techAdminPermissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the techAdminPermissions property
    Then the canViewQueueDashboard property should return false
    When I set the canViewQueueDashboard property to true
    Then the techAdminPermissions' canViewQueueDashboard should be true

  Scenario: Getting and setting canSendQueueMessages from techAdminPermissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the techAdminPermissions property
    Then the canSendQueueMessages property should return false
    When I set the canSendQueueMessages property to true
    Then the techAdminPermissions' canSendQueueMessages should be true

  Scenario: Getting userPermissions from permissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the userPermissions property
    Then it should return a StaffRoleUserPermissionsAdapter instance

  Scenario: Getting and setting canManageUsers from userPermissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the userPermissions property
    Then the canManageUsers property should return false
    When I set the canManageUsers property to true
    Then the userPermissions' canManageUsers should be true

  Scenario: Lazy-initialising permissions when document has no permissions object
    Given a StaffRoleDomainAdapter wrapping a document with no permissions object
    When I get the permissions property
    Then it should return a StaffRolePermissionsAdapter instance

  Scenario: Lazy-initialising communityPermissions when sub-document is absent
    Given a StaffRoleDomainAdapter wrapping a document with no communityPermissions sub-document
    When I get the permissions property
    And I get the communityPermissions property
    Then it should return a StaffRoleCommunityPermissionsAdapter instance
    And canManageCommunities should default to false

  Scenario: Lazy-initialising financePermissions when sub-document is absent
    Given a StaffRoleDomainAdapter wrapping a document with no financePermissions sub-document
    When I get the permissions property
    And I get the financePermissions property
    Then it should return a StaffRoleFinancePermissionsAdapter instance
    And canManageFinance should default to false

  Scenario: Lazy-initialising techAdminPermissions when sub-document is absent
    Given a StaffRoleDomainAdapter wrapping a document with no techAdminPermissions sub-document
    When I get the permissions property
    And I get the techAdminPermissions property
    Then it should return a StaffRoleTechAdminPermissionsAdapter instance
    And canManageTechAdmin should default to false

  Scenario: Lazy-initialising userPermissions when sub-document is absent
    Given a StaffRoleDomainAdapter wrapping a document with no userPermissions sub-document
    When I get the permissions property
    And I get the userPermissions property
    Then it should return a StaffRoleUserPermissionsAdapter instance
    And canManageUsers should default to false

  Scenario: Getting roleType returns null when document roleType is undefined
    Given a StaffRoleDomainAdapter wrapping a document with no roleType
    When I get the roleType property
    Then it should return null

  # ─── enterpriseAppRole ──────────────────────────────────────────────────────

  Scenario: Getting enterpriseAppRole returns empty string when not set on the document
    Given a StaffRoleDomainAdapter for the document
    When I get the enterpriseAppRole property
    Then it should return an empty string

  Scenario: Getting and setting the enterpriseAppRole property
    Given a StaffRoleDomainAdapter for the document
    When I set the enterpriseAppRole property to "LeadManager"
    Then the document's enterpriseAppRole should be "LeadManager"

  Scenario: Setting roleName also updates enterpriseAppRole on the document
    Given a StaffRoleDomainAdapter for the document
    When I set the roleName property to "Director"
    Then the document's enterpriseAppRole should also be "Director"

  Scenario: canAssignStaffRoles getter falls back to canAssignStaffRoles when unset
    Given a StaffRoleDomainAdapter wrapping a document with userPermissions having only canAssignStaffRoles true
    When I get the permissions property
    And I get the userPermissions property
    Then the canAssignStaffRoles property should return true

  Scenario: Setting canAssignStaffRoles updates the canAssignStaffRoles property
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the userPermissions property
    When I set the canAssignStaffRoles property to true
    Then the userPermissions' canAssignStaffRoles should be true

  # ─── violationTicketPermissions setters ──────────────────────────────────────

  Scenario: Setting canManageTickets on violationTicketPermissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the violationTicketPermissions property
    When I set the canManageTickets property to true
    Then the violationTicketPermissions' canManageTickets should be true

  Scenario: Setting canAssignTickets on violationTicketPermissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the violationTicketPermissions property
    When I set the canAssignTickets property to true
    Then the violationTicketPermissions' canAssignTickets should be true

  Scenario: Setting canWorkOnTickets on violationTicketPermissions
    Given a StaffRoleDomainAdapter for the document
    When I get the permissions property
    And I get the violationTicketPermissions property
    When I set the canWorkOnTickets property to true
    Then the violationTicketPermissions' canWorkOnTickets should be true

  # ─── Lazy-init remaining sub-documents ───────────────────────────────────────

  Scenario: Lazy-initialising propertyPermissions when sub-document is absent
    Given a StaffRoleDomainAdapter wrapping a document with no propertyPermissions sub-document
    When I get the permissions property
    And I get the propertyPermissions property
    Then it should return a StaffRolePropertyPermissionsAdapter instance
    And canManageProperties should default to false

  Scenario: Lazy-initialising servicePermissions when sub-document is absent
    Given a StaffRoleDomainAdapter wrapping a document with no servicePermissions sub-document
    When I get the permissions property
    And I get the servicePermissions property
    Then it should return a StaffRoleServicePermissionsAdapter instance
    And canManageServices should default to false

  Scenario: Lazy-initialising serviceTicketPermissions when sub-document is absent
    Given a StaffRoleDomainAdapter wrapping a document with no serviceTicketPermissions sub-document
    When I get the permissions property
    And I get the serviceTicketPermissions property
    Then it should return a StaffRoleServiceTicketPermissionsAdapter instance
    And canCreateTickets should default to false

  Scenario: Lazy-initialising violationTicketPermissions when sub-document is absent
    Given a StaffRoleDomainAdapter wrapping a document with no violationTicketPermissions sub-document
    When I get the permissions property
    And I get the violationTicketPermissions property
    Then it should return a StaffRoleViolationTicketPermissionsAdapter instance
    And canCreateTickets should default to false
