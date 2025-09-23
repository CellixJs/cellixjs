import type { EndUserEntityReference } from '../../../contexts/user/end-user/end-user.ts';
import type { StaffRoleEntityReference } from '../../../contexts/user/staff-role/staff-role.ts';
import type { StaffUserEntityReference } from '../../../contexts/user/staff-user/staff-user.ts';
import type { UserPassport } from '../../../contexts/user/user.passport.ts';
import type { UserVisa } from '../../../contexts/user/user.visa.ts';
import type { VendorUserEntityReference } from '../../../contexts/user/vendor-user/vendor-user.ts';
import { MemberPassportBase } from '../member.passport-base.ts';
import { MemberUserEndUserVisa } from './member.user.end-user.visa.ts';
import { MemberUserStaffRoleVisa } from './member.user.staff-role.visa.ts';
import { MemberUserStaffUserVisa } from './member.user.staff-user.visa.ts';
import { MemberUserVendorUserVisa } from './member.user.vendor-user.visa.ts';

export class MemberUserPassport
	extends MemberPassportBase
	implements UserPassport
{
	forStaffUser(root: StaffUserEntityReference): UserVisa {
		return new MemberUserStaffUserVisa(root, this._member);
	}
	forStaffRole(root: StaffRoleEntityReference): UserVisa {
		return new MemberUserStaffRoleVisa(root, this._member);
	}
	forVendorUser(root: VendorUserEntityReference): UserVisa {
		return new MemberUserVendorUserVisa(root, this._member);
	}
	forEndUser(root: EndUserEntityReference): UserVisa {
		return new MemberUserEndUserVisa(root, this._member);
	}
}
