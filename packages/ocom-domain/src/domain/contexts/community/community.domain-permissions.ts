export interface CommunityDomainPermissions {
	//community aggregate root permissions
	canManageCommunitySettings: boolean;
	canCreateCommunities: boolean;

	//member aggregate root permissions
	canManageMembers: boolean;
	canEditOwnMemberProfile: boolean;
	canEditOwnMemberAccounts: boolean;
	isEditingOwnMemberAccount: boolean;

	//role aggregate root permissions
	canManageEndUserRolesAndPermissions: boolean;
	canManageVendorUserRolesAndPermissions: boolean;

	//other permissions
	canManageSiteContent: boolean;
	isSystemAccount: boolean;
}
