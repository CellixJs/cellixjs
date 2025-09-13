import type { MemberEntityReference } from '../../../contexts/community/member/member.ts';
import type { StaffRoleEntityReference } from '../../../contexts/user/staff-role/staff-role.ts';
import type { UserDomainPermissions } from '../../../contexts/user/user.domain-permissions.ts';
import type { UserVisa } from '../../../contexts/user/user.visa.ts';

export class MemberUserStaffRoleVisa<root extends StaffRoleEntityReference>
	implements UserVisa
{
	//biome-ignore lint:noUsedVars
	private readonly root: root;

	constructor(root: root, _member: MemberEntityReference) {
		this.root = root;
	}

	determineIf(
		func: (permissions: Readonly<UserDomainPermissions>) => boolean,
	): boolean {
		const updatedPermissions: UserDomainPermissions = {
			canManageEndUsers: false,
			canManageStaffRolesAndPermissions: false,
			canManageStaffUsers: false,
			canManageVendorUsers: false,
			isEditingOwnAccount: false,
			isSystemAccount: false,
		};

		return func(updatedPermissions);
	}
}
