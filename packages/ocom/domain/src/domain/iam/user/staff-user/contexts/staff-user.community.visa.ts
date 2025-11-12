import type { CommunityEntityReference } from '../../../../contexts/community/community/community.ts';
import type { CommunityDomainPermissions } from '../../../../contexts/community/community.domain-permissions.ts';
import type { CommunityVisa } from '../../../../contexts/community/community.visa.ts';
import type { StaffUserEntityReference } from '../../../../contexts/user/staff-user/staff-user.ts';

export class StaffUserCommunityVisa<root extends CommunityEntityReference>
	implements CommunityVisa
{
	private readonly root: root;
	private readonly user: StaffUserEntityReference;

	constructor(root: root, user: StaffUserEntityReference) {
		this.root = root;
		this.user = user;
	}

	determineIf(
		func: (permissions: CommunityDomainPermissions) => boolean,
	): boolean {
		//ensure that the member is a member of the community
		if (!this.user.role) {
			console.log(
				'Staff Role Visa : undefined user or role',
				this.user,
				this.root,
			);
			return false;
		}

		const { communityPermissions } = this.user.role.permissions;
		// [NN] [ESLINT] commenting this out to follow ESLint rule @typescript-eslint/no-unnecessary-condition
		// if(!communityPermissions) {
		//   console.log("Staff Role Visa : no community permissions");
		//   return false;
		// }

		const updatedPermissions: CommunityDomainPermissions = {
			canManageCommunitySettings: communityPermissions.canManageAllCommunities,
			canCreateCommunities: communityPermissions.canManageAllCommunities,
			canManageMembers: communityPermissions.canManageAllCommunities,
			canEditOwnMemberProfile: communityPermissions.canManageAllCommunities,
			canEditOwnMemberAccounts: communityPermissions.canManageAllCommunities,
			isEditingOwnMemberAccount: false,
			canManageEndUserRolesAndPermissions:
				communityPermissions.canManageAllCommunities,
			canManageVendorUserRolesAndPermissions:
				communityPermissions.canManageAllCommunities,
			canManageSiteContent: communityPermissions.canManageAllCommunities,
			isSystemAccount: false,
		};

		return func(updatedPermissions);
	}
}
