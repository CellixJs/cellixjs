import type { MemberEntityReference } from '../../../contexts/community/member/member.ts';
import type { EndUserEntityReference } from '../../../contexts/user/end-user/end-user.ts';
import type { UserDomainPermissions } from '../../../contexts/user/user.domain-permissions.ts';
import type { UserVisa } from '../../../contexts/user/user.visa.ts';

export class MemberUserEndUserVisa<root extends EndUserEntityReference>
	implements UserVisa
{
	private readonly root: root;
	private readonly member: MemberEntityReference;

	constructor(root: root, member: MemberEntityReference) {
		this.root = root;
		this.member = member;
	}

	determineIf(
		func: (permissions: Readonly<UserDomainPermissions>) => boolean,
	): boolean {
		const updatedPermissions: UserDomainPermissions = {
			canManageEndUsers: false,
			canManageStaffRolesAndPermissions: false,
			canManageStaffUsers: false,
			canManageVendorUsers: false,
			isEditingOwnAccount: this.member.accounts.some(
				(account) => account.user.id === this.root.id,
			),
			isSystemAccount: false,
		};

		return func(updatedPermissions);
	}
}
