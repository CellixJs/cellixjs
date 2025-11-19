import type { EndUserEntityReference } from '../../../contexts/user/end-user/index.ts';
import type { StaffRoleEntityReference } from '../../../contexts/user/staff-role/staff-role.ts';
import type { StaffUserEntityReference } from '../../../contexts/user/staff-user/index.ts';
import type { UserPassport } from '../../../contexts/user/user.passport.ts';
import type { UserVisa } from '../../../contexts/user/user.visa.ts';
import type { VendorUserEntityReference } from '../../../contexts/user/vendor-user/vendor-user.ts';
import { GuestPassportBase } from '../guest.passport-base.ts';

export class GuestUserPassport
	extends GuestPassportBase
	implements UserPassport
{
	forEndUser(_root: EndUserEntityReference): UserVisa {
		return { determineIf: () => false };
	}

	forStaffUser(_root: StaffUserEntityReference): UserVisa {
		return { determineIf: () => false };
	}

	forStaffRole(_root: StaffRoleEntityReference): UserVisa {
		return { determineIf: () => false };
	}

	forVendorUser(_root: VendorUserEntityReference): UserVisa {
		return { determineIf: () => false };
	}
}
