import type { CommunityEntityReference } from '../../../contexts/community/community/community.ts';
import type { CommunityDomainPermissions } from '../../../contexts/community/community.domain-permissions.ts';
import type { CommunityVisa } from '../../../contexts/community/community.visa.ts';
import type { MemberEntityReference } from '../../../contexts/community/member/member.ts';

export class MemberCommunityVisa<root extends CommunityEntityReference>
	implements CommunityVisa
{
	private readonly root: root;
	private readonly member: MemberEntityReference;

	constructor(root: root, member: MemberEntityReference) {
		this.root = root;
		this.member = member;
	}

	determineIf(
		func: (permissions: CommunityDomainPermissions) => boolean,
	): boolean {
		//ensure that the member is a member of this community
		if (this.member.community.id !== this.root.id) {
			console.log(
				'Member Visa: member is not a member of this community',
				this.member,
				this.root,
			);
			return false;
		}

		const { communityPermissions } = this.member.role.permissions;
		// [NN] [ESLINT] commenting this out to follow ESLint rule @typescript-eslint/no-unnecessary-condition
		// if(!communityPermissions) {
		//   console.log("Member Visa: no community permissions");
		//   return false;
		// }
        const updatedPermissions: CommunityDomainPermissions = {
            canManageCommunitySettings: communityPermissions.canManageCommunitySettings,
            canManageMembers: communityPermissions.canManageMembers,
            canEditOwnMemberProfile: communityPermissions.canEditOwnMemberProfile,
            canEditOwnMemberAccounts: communityPermissions.canEditOwnMemberAccounts,
            canManageEndUserRolesAndPermissions:
                communityPermissions.canManageEndUserRolesAndPermissions,
            canManageSiteContent: communityPermissions.canManageSiteContent,
            isEditingOwnMemberAccount: false,
            canCreateCommunities: true, //TODO: add a more complext rule here like can only create one community for free, otherwise need a paid plan
            canManageVendorUserRolesAndPermissions: false, // end user roles cannot manage vendor user roles
            isSystemAccount: false,
        };

		return func(updatedPermissions);
	}
}
